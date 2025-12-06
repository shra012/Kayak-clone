"""LLM-powered generator that emits MongoDB query specs."""

import json
import os
from textwrap import dedent
from typing import Any, Dict, Optional

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI


MONGO_SCHEMA_SUMMARY = dedent(
    """
    You read from MongoDB collections that power a Kayak-like concierge.
    The key collections and fields are:

    1. flights
       - flightNumber (string)
       - airline (string)
       - from (IATA code)
       - to (IATA code)
       - departDate (YYYY-MM-DD)
       - departTime (HH:MM)
       - arriveDate / arriveTime
       - durationMinutes (int)
       - nonstop (bool)
       - price (number)
       - seatsAvailable (int)
       - class (economy | premium_economy | business | first)

    2. hotels
       - listingId
       - name
       - city, state, country
       - neighborhood
       - nightlyPrice (number)
       - stars (1-5)
       - amenities (array of strings)
       - reviewScore (number)
       - roomsAvailable (int)

    3. cars
       - listingId
       - company
       - city / airport
       - vehicleType (SUV, sedan, compact, etc.)
       - seats, luggage, transmission
       - dailyPrice (number)
       - availability (int)

    4. airports
       - code (IATA)
       - city, state, country
       - name
       - timezone

    Rules:
    - Only read data; NEVER request inserts/updates.
    - Always limit to <= 20 documents.
    - Filters must be valid MongoDB JSON (use $gte/$lte/$regex for ranges).
    - Prefer case-insensitive regex for fuzzy text fields.
    - Include sort order when user asks for "cheapest", "top", or "latest".
    - Respect context (destination city, budget, dates, traveler count).
    """
).strip()


class MongoQueryGenerator:
    """Uses an LLM to build MongoDB query specs."""

    def __init__(self, llm: Optional[BaseChatModel] = None):
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        temperature = float(os.getenv("SQL_GENERATOR_TEMPERATURE", "0"))
        self.llm = llm or ChatOpenAI(model=model_name, temperature=temperature)

    async def generate(self, question: str, context: Dict[str, Any]) -> Dict[str, Any]:
        context_payload = json.dumps(context or {}, default=str)
        system_prompt = SystemMessage(content=MONGO_SCHEMA_SUMMARY)
        human_prompt = dedent(
            f"""
            Question: {question}
            Context JSON: {context_payload}

            Produce a strict JSON object with these keys:
            {{
                "collection": "flights|hotels|cars|airports",
                "filters": <MongoDB filter object>,
                "projection": <optional projection or null>,
                "sort": [["field", 1|-1], ...] or [],
                "limit": <int <= 20>
            }}

            Use ISO date strings for dates. If the request cannot be satisfied, reply with __UNSUPPORTED__.
            """
        ).strip()

        response = await self.llm.ainvoke([system_prompt, HumanMessage(content=human_prompt)])
        spec = self._parse_spec(response.content)
        return spec

    @staticmethod
    def _parse_spec(raw: str) -> Dict[str, Any]:
        if not raw:
            raise MongoQueryGeneratorError("Mongo query generator returned an empty response.")
        text = raw.strip()
        if text == "__UNSUPPORTED__":
            raise MongoQueryGeneratorError("This question cannot be answered with MongoDB listings.")
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise MongoQueryGeneratorError(f"Mongo query generator returned invalid JSON: {exc}") from exc

        if not isinstance(data, dict):
            raise MongoQueryGeneratorError("Mongo query generator must return a JSON object.")
        if not data.get("collection"):
            raise MongoQueryGeneratorError("Mongo query generator did not provide a collection.")
        if "filters" not in data:
            raise MongoQueryGeneratorError("Mongo query generator did not provide filters.")
        if not data.get("limit"):
            data["limit"] = 10
        return data


class MongoQueryGeneratorError(RuntimeError):
    """Raised when the Mongo query generation step fails."""
