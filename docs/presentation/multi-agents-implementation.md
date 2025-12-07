# Multi-Agents Implementation

## Overview

The Kayak clone implements a **multi-agent system** for intelligent travel recommendations and concierge services. The system uses an AI Agent service built with FastAPI that integrates with OpenAI's LLM to provide personalized travel assistance.

## Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        User[User]
        Frontend[React Frontend]
    end
    
    subgraph "Backend Services"
        ConciergeSvc[Concierge Service<br/>Node.js/Express]
        BackendAPI[Backend API Gateway]
    end
    
    subgraph "AI Agent Service"
        AIAgent[AI Agent Service<br/>FastAPI :8000]
        
        subgraph "Agent Components"
            IntentParser[Intent Parser<br/>Natural Language Understanding]
            BundleBuilder[Bundle Builder<br/>Recommendation Engine]
            DealProcessor[Deal Processor<br/>Price Watch Handler]
            MCPClient[MCP Client<br/>Model Context Protocol]
        end
        
        subgraph "LLM Integration"
            OpenAI[OpenAI API<br/>GPT-4 / GPT-3.5]
        end
    end
    
    subgraph "Data Storage"
        MongoDB[(MongoDB<br/>Concierge Sessions)]
        SQLite[(SQLite<br/>Agent State)]
    end
    
    User -->|Chat Message| Frontend
    Frontend -->|POST /api/v1/concierge| BackendAPI
    BackendAPI -->|Forward Request| ConciergeSvc
    ConciergeSvc -->|HTTP Request| AIAgent
    
    AIAgent --> IntentParser
    IntentParser --> MCPClient
    MCPClient --> OpenAI
    OpenAI -->|Response| MCPClient
    MCPClient --> BundleBuilder
    BundleBuilder --> DealProcessor
    
    AIAgent -->|Store Session| MongoDB
    AIAgent -->|Store State| SQLite
    
    AIAgent -->|Response| ConciergeSvc
    ConciergeSvc -->|Response| BackendAPI
    BackendAPI -->|Response| Frontend
    Frontend -->|Display| User
    
    style AIAgent fill:#00BCD4,color:#fff
    style IntentParser fill:#4CAF50,color:#fff
    style BundleBuilder fill:#4CAF50,color:#fff
    style DealProcessor fill:#4CAF50,color:#fff
    style MCPClient fill:#9C27B0,color:#fff
    style OpenAI fill:#FF9800,color:#fff
```

## Agent Components

### 1. Intent Parser Agent
**Purpose**: Understands user intent from natural language queries

**Capabilities**:
- Extracts travel preferences (destination, dates, budget)
- Identifies booking intent (flight, hotel, car)
- Parses complex queries with multiple requirements
- Handles ambiguous requests

**Implementation**:
- Location: `ai-agent/intent_parser.py`
- Uses OpenAI API for NLU
- Returns structured intent objects

### 2. Bundle Builder Agent
**Purpose**: Creates optimized travel bundles

**Capabilities**:
- Combines flights + hotels + cars
- Optimizes for price and convenience
- Considers user preferences
- Generates multiple bundle options

**Implementation**:
- Location: `ai-agent/bundle_builder.py`
- Queries listings service
- Applies optimization algorithms
- Returns ranked bundle recommendations

### 3. Deal Processor Agent
**Purpose**: Monitors prices and triggers deals

**Capabilities**:
- Sets up price watches
- Monitors inventory changes
- Triggers notifications on price drops
- Processes deal events from Kafka

**Implementation**:
- Location: `ai-agent/deal_processor.py`
- Listens to Kafka topics
- Updates watch status
- Sends notifications

### 4. MCP Client Agent
**Purpose**: Manages communication with LLM

**Capabilities**:
- Formats prompts for LLM
- Manages conversation context
- Handles token limits
- Processes LLM responses

**Implementation**:
- Location: `ai-agent/mcp_client.py`
- Integrates with OpenAI API
- Manages conversation history
- Handles streaming responses

## Agent Communication Flow

```mermaid
sequenceDiagram
    participant User
    participant Concierge
    participant AIAgent
    participant IntentParser
    participant BundleBuilder
    participant LLM
    
    User->>Concierge: "I need a trip to NYC next week"
    Concierge->>AIAgent: POST /chat {message, sessionId}
    
    AIAgent->>IntentParser: Parse user intent
    IntentParser->>LLM: Analyze query
    LLM-->>IntentParser: Intent: {destination: NYC, dates: next week}
    IntentParser-->>AIAgent: Structured intent
    
    AIAgent->>BundleBuilder: Build bundles for intent
    BundleBuilder->>Concierge: Query available listings
    Concierge-->>BundleBuilder: Flight + Hotel options
    BundleBuilder->>BundleBuilder: Optimize bundles
    BundleBuilder-->>AIAgent: Recommended bundles
    
    AIAgent->>LLM: Generate natural response
    LLM-->>AIAgent: Personalized recommendation text
    AIAgent-->>Concierge: Response with bundles
    Concierge-->>User: Display recommendations
```

## Use Cases

### Use Case 1: Natural Language Search
```
User: "Find me a cheap flight to Paris in December"
Agent: Parses intent → Searches flights → Returns results
```

### Use Case 2: Bundle Recommendations
```
User: "I want a weekend trip to Miami"
Agent: Creates bundles → Optimizes price → Recommends best options
```

### Use Case 3: Price Watch
```
User: "Notify me when flights to Tokyo drop below $500"
Agent: Creates watch → Monitors prices → Sends notification
```

### Use Case 4: Conversational Booking
```
User: "What about hotels near the beach?"
Agent: Maintains context → Searches hotels → Provides recommendations
```

## Technical Implementation

### AI Agent Service Structure
```
ai-agent/
├── main.py              # FastAPI application
├── intent_parser.py     # Intent parsing agent
├── bundle_builder.py    # Bundle recommendation agent
├── deal_processor.py    # Deal processing agent
├── mcp_client.py       # LLM communication client
├── models.py           # Data models
├── mock_data.py        # Test data
└── requirements.txt    # Python dependencies
```

### API Endpoints
- `POST /chat` - Chat with concierge
- `POST /bundles` - Generate bundles
- `POST /watches` - Create price watch
- `GET /watches/{watchId}` - Get watch status
- `DELETE /watches/{watchId}` - Cancel watch

### Integration Points
1. **Backend API**: HTTP REST communication
2. **MongoDB**: Session storage
3. **Kafka**: Event consumption (price changes, inventory updates)
4. **OpenAI API**: LLM integration

## Performance Characteristics

- **Response Time**: 2-5 seconds (includes LLM call)
- **Concurrent Sessions**: Supports multiple simultaneous users
- **Context Management**: Maintains conversation history
- **Token Usage**: Optimized prompts to reduce costs

## Future Enhancements

1. **Multi-Model Support**: Support for multiple LLM providers
2. **Agent Orchestration**: Coordinate multiple agents for complex tasks
3. **Learning Agent**: Improve recommendations based on user feedback
4. **Voice Integration**: Support for voice-based interactions





