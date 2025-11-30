"""
Concierge AI & Health Monitoring Service
Multi-agent travel concierge with deal detection, bundle building, and WebSocket updates
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
import uvicorn
import os
import json
import asyncio
from contextlib import asynccontextmanager

# Health check imports
import psutil
import time

# Local imports
from models import Deal, Bundle, Watch, ChatSession, DealType, DealStatus
from deal_processor import DealProcessor
from bundle_builder import BundleBuilder
from intent_parser import IntentParser
from mock_data import generate_mock_deals
from mcp_client import MCPClient

# SQLModel setup
from sqlmodel import SQLModel, create_engine, Session, select

# Database setup - Use Supabase PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", os.getenv("SUPABASE_DATABASE_URL", "sqlite:///./data/concierge.db"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Use PostgreSQL if Supabase URL is provided, otherwise fallback to SQLite
if SUPABASE_URL and "postgresql" in DATABASE_URL.lower():
    # PostgreSQL/Supabase connection
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
else:
    # SQLite fallback for local dev
    os.makedirs("./data", exist_ok=True)
    engine = create_engine(DATABASE_URL, echo=False)

# Create tables
SQLModel.metadata.create_all(engine)

app = FastAPI(
    title="Concierge AI & Health Monitoring Service",
    description="Multi-agent travel concierge with deal detection, bundle building, and real-time updates",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # session_id -> set of websockets
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def broadcast_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn, session_id)

manager = ConnectionManager()

# Initialize MCP client for query generation
mcp_client = MCPClient()

# In-memory deal cache (in production, use Redis)
deal_cache: Dict[str, Deal] = {}

# Request/Response Models (Pydantic v2)
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class ChatSessionRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    initial_message: Optional[str] = Field(None, description="Initial user message")

class ChatSessionResponse(BaseModel):
    session_id: str
    user_id: str
    created_at: datetime
    messages: List[ChatMessage]
    context: Dict[str, Any]

class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="User message")
    session_id: str = Field(..., description="Session ID")

class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
    bundles: Optional[List[Dict[str, Any]]] = None
    timestamp: datetime

class BundleRecommendation(BaseModel):
    bundle_id: str
    total_price: float
    fit_score: float
    why_this: str
    what_to_watch: str
    flight: Dict[str, Any]
    hotel: Dict[str, Any]

class BundleResponse(BaseModel):
    bundles: List[BundleRecommendation]

class WatchRequest(BaseModel):
    user_id: str
    bundle_id: Optional[str] = None
    deal_id: Optional[str] = None
    price_threshold: Optional[float] = None
    inventory_threshold: Optional[int] = None

class WatchResponse(BaseModel):
    watch_id: str
    user_id: str
    bundle_id: Optional[str]
    deal_id: Optional[str]
    price_threshold: Optional[float]
    inventory_threshold: Optional[int]
    active: bool
    created_at: datetime

class PolicyQuestionRequest(BaseModel):
    listing_id: str
    question_type: str = Field(..., description="cancellation, pets, parking, refund")

class PolicyAnswerResponse(BaseModel):
    listing_id: str
    question_type: str
    answer: str
    source: str

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str

class DetailedHealthResponse(HealthResponse):
    uptime_seconds: float
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float

class WebSocketEvent(BaseModel):
    event_type: str  # "deal_update", "watch_alert", "price_drop", "inventory_low"
    data: Dict[str, Any]
    timestamp: datetime

# Startup event
start_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Concierge AI Service starting up...")
    print("Initializing deal cache...")
    with Session(engine) as session:
        deals = session.exec(select(Deal).where(Deal.status == DealStatus.ACTIVE)).all()
        if not deals:
            print("Generating mock deals...")
            mock_deals = generate_mock_deals()
            for deal in mock_deals:
                session.add(deal)
                deal_cache[deal.deal_id] = deal
            session.commit()
        else:
            for deal in deals:
                deal_cache[deal.deal_id] = deal
    print(f"Loaded {len(deal_cache)} deals into cache")
    
    asyncio.create_task(watch_monitor_task())
    
    yield
    
    print("Concierge AI Service shutting down...")

app.router.lifespan_context = lifespan

@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time event updates
    Relays watch alerts, deal updates, price drops, inventory changes
    """
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
            await websocket.send_json({
                "type": "ack",
                "message": "Message received",
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

@app.post("/api/v1/concierge/sessions", response_model=ChatSessionResponse, tags=["Concierge AI"])
async def create_chat_session(request: ChatSessionRequest):
    """
    Create a new AI chat session for a user
    """
    session_id = f"session_{request.user_id}_{int(time.time())}"
    
    messages = []
    context = {}
    
    if request.initial_message:
        messages.append(ChatMessage(role="user", content=request.initial_message))
        # Parse intent
        constraints = IntentParser.parse_travel_request(request.initial_message)
        context.update(constraints)
        
        # Check if we need clarification
        clarification = IntentParser.needs_clarification(constraints)
        if clarification:
            ai_response = clarification
        else:
            # Generate bundles
            bundles = await build_bundles_from_constraints(constraints)
            if bundles:
                ai_response = format_bundle_recommendation(bundles)
            else:
                ai_response = await generate_ai_response(request.initial_message, constraints)
        
        messages.append(ChatMessage(role="assistant", content=ai_response))
    
    # Save session to database
    session = ChatSession(
        session_id=session_id,
        user_id=request.user_id,
        context=context
    )
    with Session(engine) as db_session:
        db_session.add(session)
        db_session.commit()
    
    return ChatSessionResponse(
        session_id=session_id,
        user_id=request.user_id,
        created_at=datetime.now(),
        messages=messages,
        context=context
    )

@app.post("/api/v1/concierge/sessions/{session_id}/messages", response_model=ChatMessageResponse, tags=["Concierge AI"])
async def send_message(session_id: str, request: ChatMessageRequest):
    """
    Send a message in an existing chat session
    Supports refinement: "Make it pet-friendly and avoid red-eye flights"
    """
    # Load session context
    with Session(engine) as db_session:
        session = db_session.exec(
            select(ChatSession).where(ChatSession.session_id == session_id)
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        context = session.context.copy()
        
        # Parse new constraints (refinement)
        new_constraints = IntentParser.parse_travel_request(request.message, context)
        context.update(new_constraints)
        
        # Update session context
        session.context = context
        session.updated_at = datetime.now()
        db_session.add(session)
        db_session.commit()
    
    # Generate response
    clarification = IntentParser.needs_clarification(context)
    if clarification:
        ai_response = clarification
        bundles = None
    else:
        # Build bundles with updated constraints
        bundles = await build_bundles_from_constraints(context)
        if bundles:
            ai_response = format_bundle_recommendation(bundles, is_refinement=True)
        else:
            ai_response = await generate_ai_response(request.message, context)
    
    # Format bundles for response
    bundle_data = None
    if bundles:
        bundle_data = [format_bundle_for_response(b) for b in bundles]
    
    return ChatMessageResponse(
        session_id=session_id,
        response=ai_response,
        bundles=bundle_data,
        timestamp=datetime.now()
    )

@app.get("/api/v1/concierge/sessions/{session_id}", response_model=ChatSessionResponse, tags=["Concierge AI"])
async def get_chat_session(session_id: str):
    """Get chat session details"""
    with Session(engine) as db_session:
        session = db_session.exec(
            select(ChatSession).where(ChatSession.session_id == session_id)
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return ChatSessionResponse(
            session_id=session.session_id,
            user_id=session.user_id,
            created_at=session.created_at,
            messages=[],  # Could load from separate messages table
            context=session.context
        )

@app.get("/api/v1/concierge/bundles", response_model=BundleResponse, tags=["Bundles"])
async def get_bundles(
    user_id: Optional[str] = None,
    destination: Optional[str] = None,
    budget: Optional[float] = None,
    max_results: int = 3
):
    """
    Get flight+hotel bundles from cached deals
    Builds bundles with Fit Score calculation
    """
    constraints = {}
    if user_id:
        constraints["user_id"] = user_id
    if destination:
        constraints["destination"] = destination
    if budget:
        constraints["budget"] = budget
    
    bundles = await build_bundles_from_constraints(constraints, max_results)
    
    recommendations = [format_bundle_for_response(b) for b in bundles]
    
    return BundleResponse(bundles=recommendations)

@app.get("/api/v1/concierge/bundles/{bundle_id}", tags=["Bundles"])
async def get_bundle(bundle_id: str):
    """Get bundle details"""
    with Session(engine) as db_session:
        bundle = db_session.exec(
            select(Bundle).where(Bundle.bundle_id == bundle_id)
        ).first()
        
        if not bundle:
            raise HTTPException(status_code=404, detail="Bundle not found")
        
        # Load flight and hotel deals
        flight_deal = None
        hotel_deal = None
        if bundle.flight_deal_id:
            flight_deal = db_session.get(Deal, bundle.flight_deal_id)
        if bundle.hotel_deal_id:
            hotel_deal = db_session.get(Deal, bundle.hotel_deal_id)
        
        return format_bundle_for_response(bundle, flight_deal, hotel_deal)

@app.post("/api/v1/concierge/watches", response_model=WatchResponse, tags=["Watches"])
async def create_watch(request: WatchRequest):
    """
    Create a watch (price alert, availability alert)
    Example: "Track this Miami package; alert me if it dips below $850 or inventory drops under 5 rooms"
    """
    watch_id = f"watch_{request.user_id}_{int(time.time())}"
    
    watch = Watch(
        watch_id=watch_id,
        user_id=request.user_id,
        bundle_id=request.bundle_id,
        deal_id=request.deal_id,
        price_threshold=request.price_threshold,
        inventory_threshold=request.inventory_threshold,
        active=True
    )
    
    with Session(engine) as db_session:
        db_session.add(watch)
        db_session.commit()
        db_session.refresh(watch)
    
    return WatchResponse(
        watch_id=watch.watch_id,
        user_id=watch.user_id,
        bundle_id=watch.bundle_id,
        deal_id=watch.deal_id,
        price_threshold=watch.price_threshold,
        inventory_threshold=watch.inventory_threshold,
        active=watch.active,
        created_at=watch.created_at
    )

@app.get("/api/v1/concierge/watches", tags=["Watches"])
async def list_watches(user_id: Optional[str] = None):
    """List all watches, optionally filtered by user_id"""
    with Session(engine) as db_session:
        if user_id:
            watches = db_session.exec(
                select(Watch).where(Watch.user_id == user_id)
            ).all()
        else:
            watches = db_session.exec(select(Watch)).all()
        
        return {"watches": [w.dict() for w in watches]}

@app.post("/api/v1/concierge/query", tags=["Database Queries"])
async def execute_database_query(request: Dict[str, Any]):
    """
    Execute database query using MCP
    Allows AI concierge to answer questions by querying Supabase
    """
    user_question = request.get("question", "")
    context = request.get("context", {})
    
    if not user_question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    # Generate query using MCP
    query_result = await mcp_client.generate_query(
        user_question=user_question,
        context=context
    )
    
    if query_result.get("error"):
        raise HTTPException(
            status_code=500, 
            detail=f"Query generation failed: {query_result.get('error')}"
        )
    
    # Execute query (in production, this would execute via Supabase PostgREST)
    execution_result = await mcp_client.execute_query(
        query=query_result.get("query"),
        parameters=query_result.get("parameters", {})
    )
    
    return {
        "question": user_question,
        "query": query_result.get("query"),
        "explanation": query_result.get("explanation"),
        "result": execution_result,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/concierge/policy", response_model=PolicyAnswerResponse, tags=["Policy Q&A"])
async def get_policy_answer(request: PolicyQuestionRequest):
    """
    Answer policy questions from listing metadata
    Questions: cancellation, pets, parking, refund
    """
    # Find deal/listing
    with Session(engine) as db_session:
        deal = db_session.exec(
            select(Deal).where(Deal.listing_id == request.listing_id)
        ).first()
        
        if not deal:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Extract answer from metadata
        answer = extract_policy_answer(deal, request.question_type)
        
        return PolicyAnswerResponse(
            listing_id=request.listing_id,
            question_type=request.question_type,
            answer=answer,
            source="listing_metadata"
        )

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="concierge-ai",
        version="2.0.0"
    )

@app.get("/health/detailed", response_model=DetailedHealthResponse, tags=["Health"])
async def detailed_health_check():
    """Detailed health check with system metrics"""
    uptime = time.time() - start_time
    memory = psutil.virtual_memory()
    
    return DetailedHealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="concierge-ai",
        version="2.0.0",
        uptime_seconds=uptime,
        cpu_percent=psutil.cpu_percent(interval=0.1),
        memory_percent=memory.percent,
        memory_used_mb=memory.used / (1024 * 1024),
        memory_total_mb=memory.total / (1024 * 1024)
    )

@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """Readiness probe"""
    return {"status": "ready", "timestamp": datetime.now().isoformat()}

@app.get("/health/live", tags=["Health"])
async def liveness_check():
    """Liveness probe"""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

async def build_bundles_from_constraints(
    constraints: Dict[str, Any],
    max_results: int = 3
) -> List[Bundle]:
    """Build bundles from user constraints"""
    # Get flights and hotels from cache
    flights = [d for d in deal_cache.values() if d.deal_type == DealType.FLIGHT]
    hotels = [d for d in deal_cache.values() if d.deal_type == DealType.HOTEL]
    
    # Add user_id if not present
    if "user_id" not in constraints:
        constraints["user_id"] = "anonymous"
    
    bundles = BundleBuilder.build_bundles(
        flights=flights,
        hotels=hotels,
        user_constraints=constraints,
        max_results=max_results
    )
    
    # Save bundles to database
    with Session(engine) as db_session:
        for bundle in bundles:
            db_session.add(bundle)
        db_session.commit()
    
    return bundles

def format_bundle_recommendation(bundles: List[Bundle], is_refinement: bool = False) -> str:
    """Format bundle recommendations as natural language"""
    if not bundles:
        return "I couldn't find any matching bundles. Try adjusting your criteria."
    
    intro = "Here are some great options" + (" (updated)" if is_refinement else "") + ":\n\n"
    
    responses = []
    for i, bundle in enumerate(bundles[:3], 1):
        response = f"{i}. ${bundle.total_price:.0f} - {bundle.why_this} {bundle.what_to_watch}"
        responses.append(response)
    
    return intro + "\n".join(responses)

def format_bundle_for_response(
    bundle: Bundle,
    flight_deal: Optional[Deal] = None,
    hotel_deal: Optional[Deal] = None
) -> Dict[str, Any]:
    """Format bundle for API response"""
    with Session(engine) as db_session:
        if not flight_deal:
            flight_deal = db_session.get(Deal, bundle.flight_deal_id)
        if not hotel_deal:
            hotel_deal = db_session.get(Deal, bundle.hotel_deal_id)
    
    return {
        "bundle_id": bundle.bundle_id,
        "total_price": bundle.total_price,
        "fit_score": bundle.fit_score,
        "why_this": bundle.why_this,
        "what_to_watch": bundle.what_to_watch,
        "flight": {
            "deal_id": flight_deal.deal_id if flight_deal else None,
            "origin": flight_deal.origin if flight_deal else None,
            "destination": flight_deal.destination if flight_deal else None,
            "price": flight_deal.price if flight_deal else 0,
            "tags": flight_deal.tags if flight_deal else []
        },
        "hotel": {
            "deal_id": hotel_deal.deal_id if hotel_deal else None,
            "listing_id": hotel_deal.listing_id if hotel_deal else None,
            "destination": hotel_deal.destination if hotel_deal else None,
            "price": hotel_deal.price if hotel_deal else 0,
            "tags": hotel_deal.tags if hotel_deal else [],
            "availability": hotel_deal.availability if hotel_deal else None
        }
    }

def extract_policy_answer(deal: Deal, question_type: str) -> str:
    """Extract policy answer from deal metadata"""
    metadata = deal.deal_metadata
    
    if question_type == "cancellation":
        policy = metadata.get("cancellation_policy", "Standard cancellation policy applies")
        refund_deadline = metadata.get("refund_deadline")
        if refund_deadline:
            return f"Cancellation allowed until {refund_deadline}. {policy}"
        return policy
    
    elif question_type == "pets":
        pet_friendly = metadata.get("pet_friendly") or "Pet-friendly" in deal.tags
        if pet_friendly:
            return "Pets are allowed. Please check for any additional fees."
        return "Pets are not allowed at this property."
    
    elif question_type == "parking":
        parking = metadata.get("parking")
        if parking:
            return f"Parking: {parking}"
        return "Parking information not available."
    
    elif question_type == "refund":
        refundable = metadata.get("refundable") or "Refundable" in deal.tags
        if refundable:
            refund_window = metadata.get("refund_window", "within 24 hours")
            return f"Refundable {refund_window} of booking."
        return "Non-refundable booking."
    
    return "Policy information not available."

async def generate_ai_response(user_message: str, context: Dict[str, Any]) -> str:
    """Generate AI response using MCP for database queries or fallback to simple responses"""
    message_lower = user_message.lower()
    
    # Check if user is asking a database query question
    db_query_keywords = [
        "how many", "count", "list", "show me", "find all", "what are",
        "which", "when did", "who booked", "total", "average", "price"
    ]
    
    is_db_query = any(keyword in message_lower for keyword in db_query_keywords)
    
    if is_db_query:
        # Use MCP to generate and execute query
        try:
            query_result = await mcp_client.generate_query(
                user_question=user_message,
                context=context
            )
            
            if query_result.get("query"):
                # Format response with query explanation
                explanation = query_result.get("explanation", "Query generated")
                return f"I'll help you with that! {explanation}. Let me check the database for you."
            else:
                # Fallback if query generation fails
                error = query_result.get("error", "Unable to generate query")
                return f"I understand your question, but I'm having trouble generating a database query right now. {error}"
        except Exception as e:
            return f"I encountered an error while processing your database query: {str(e)}"
    
    # Simple conversational responses for non-database queries
    if any(word in message_lower for word in ["flight", "fly"]):
        return "I can help you find flights! What's your destination and travel dates?"
    elif any(word in message_lower for word in ["hotel", "stay"]):
        return "I'd be happy to help you find a hotel! Where would you like to stay?"
    elif any(word in message_lower for word in ["bundle", "package"]):
        return "Great! I can create a travel bundle. What are your travel dates and budget?"
    else:
        return "Hello! I'm your travel concierge. I can help you find flights, hotels, create bundles, and answer questions about bookings. How can I assist you?"

async def watch_monitor_task():
    """Background task to monitor watches and send WebSocket updates"""
    while True:
        await asyncio.sleep(30)  # Check every 30 seconds
        
        with Session(engine) as db_session:
            active_watches = db_session.exec(
                select(Watch).where(Watch.active == True)
            ).all()
            
            for watch in active_watches:
                # Check price threshold
                if watch.price_threshold:
                    deal = deal_cache.get(watch.deal_id) if watch.deal_id else None
                    if deal and deal.price <= watch.price_threshold:
                        await manager.broadcast_to_session(
                            watch.user_id,
                            {
                                "event_type": "price_drop",
                                "data": {
                                    "watch_id": watch.watch_id,
                                    "deal_id": watch.deal_id,
                                    "current_price": deal.price,
                                    "threshold": watch.price_threshold
                                },
                                "timestamp": datetime.now().isoformat()
                            }
                        )
                
                # Check inventory threshold
                if watch.inventory_threshold:
                    deal = deal_cache.get(watch.deal_id) if watch.deal_id else None
                    if deal and deal.availability and deal.availability <= watch.inventory_threshold:
                        await manager.broadcast_to_session(
                            watch.user_id,
                            {
                                "event_type": "inventory_low",
                                "data": {
                                    "watch_id": watch.watch_id,
                                    "deal_id": watch.deal_id,
                                    "current_availability": deal.availability,
                                    "threshold": watch.inventory_threshold
                                },
                                "timestamp": datetime.now().isoformat()
                            }
                        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
