"""
MCP (Model Context Protocol) Client for Supabase Query Generation
Allows AI concierge to generate and execute SQL queries based on user questions
"""
import os
import json
import httpx
from typing import Dict, Any, Optional, List
from openai import OpenAI

class MCPClient:
    """Client for interacting with MCP server to generate SQL queries"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        self.openai_client = None
        
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
    
    async def generate_query(
        self, 
        user_question: str, 
        context: Dict[str, Any] = None,
        schema_info: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL query from user question using OpenAI/MCP
        
        Args:
            user_question: User's natural language question
            context: Additional context about the conversation
            schema_info: Database schema information
            
        Returns:
            Dict with 'query' (SQL), 'explanation', and 'parameters'
        """
        if not self.openai_client:
            return {
                "query": None,
                "explanation": "OpenAI API key not configured",
                "error": "MCP client not initialized"
            }
        
        # Build schema context
        if not schema_info:
            schema_info = self._get_default_schema()
        
        # Build prompt for query generation
        prompt = self._build_query_prompt(user_question, context, schema_info)
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # or gpt-4, gpt-3.5-turbo
                messages=[
                    {
                        "role": "system",
                        "content": """You are a SQL query generator for a travel booking database (Supabase PostgreSQL).
                        Generate safe, parameterized SQL queries based on user questions.
                        Always return valid PostgreSQL syntax.
                        Use parameterized queries to prevent SQL injection.
                        Return JSON with: {"query": "SQL query", "explanation": "what the query does", "parameters": {}}"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            return {
                "query": None,
                "explanation": f"Error generating query: {str(e)}",
                "error": str(e)
            }
    
    def _build_query_prompt(
        self, 
        user_question: str, 
        context: Dict[str, Any] = None,
        schema_info: str = None
    ) -> str:
        """Build prompt for query generation"""
        prompt = f"""Generate a SQL query for this question: "{user_question}"

Database Schema:
{schema_info}

"""
        if context:
            prompt += f"\nContext: {json.dumps(context, indent=2)}\n"
        
        prompt += """
Return a JSON object with:
- "query": The SQL query (use $1, $2, etc. for parameters)
- "explanation": Brief explanation of what the query does
- "parameters": Object with parameter values

Example:
{
  "query": "SELECT * FROM hotels WHERE city = $1 AND price_per_night <= $2",
  "explanation": "Finds hotels in a specific city under a price limit",
  "parameters": {"city": "New York", "max_price": 200}
}
"""
        return prompt
    
    def _get_default_schema(self) -> str:
        """Get default database schema information"""
        return """
Tables in Supabase:
- users (id, email, first_name, last_name, profile_type, created_at)
- listings (id, type, title, description, city, country, price_per_night, lat, lng, amenities, images)
- bookings (id, user_id, listing_id, check_in, check_out, total_price, status, created_at)
- reviews (id, listing_id, user_id, rating, comment, created_at)
- payments (id, booking_id, amount, status, payment_method, created_at)

Common queries:
- Find hotels in a city: SELECT * FROM listings WHERE type = 'hotel' AND city = $1
- Find flights: SELECT * FROM listings WHERE type = 'flight' AND origin = $1 AND destination = $2
- User bookings: SELECT * FROM bookings WHERE user_id = $1
- Reviews for a listing: SELECT * FROM reviews WHERE listing_id = $1 ORDER BY created_at DESC
"""
    
    async def execute_query(
        self, 
        query: str, 
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute SQL query on Supabase using PostgREST or direct SQL
        
        Note: For security, this should use Supabase's PostgREST API or RPC functions
        rather than raw SQL execution. This is a simplified version.
        """
        if not self.supabase_url or not self.supabase_key:
            return {
                "error": "Supabase credentials not configured",
                "data": None
            }
        
        # In production, use Supabase's PostgREST API or RPC functions
        # For now, return a placeholder
        return {
            "data": None,
            "message": "Query execution should be done via Supabase PostgREST API or RPC functions for security",
            "query": query,
            "parameters": parameters
        }

