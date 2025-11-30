"""
Natural Language Understanding for user intent parsing
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import re


class IntentParser:
    """Parses user intent from natural language"""
    
    @staticmethod
    def parse_travel_request(message: str, session_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Parse user travel request from natural language
        Example: "I've got Oct 25–27, SFO to anywhere warm, total budget $1,000 for two"
        """
        message_lower = message.lower()
        constraints = session_context.copy() if session_context else {}
        
        # Parse dates
        dates = IntentParser._parse_dates(message)
        if dates:
            constraints.update(dates)
        
        # Parse origin
        origin = IntentParser._parse_origin(message)
        if origin:
            constraints["origin"] = origin
        
        # Parse destination
        destination = IntentParser._parse_destination(message)
        if destination:
            constraints["destination"] = destination
        
        # Parse budget
        budget = IntentParser._parse_budget(message)
        if budget:
            constraints["budget"] = budget
        
        # Parse number of travelers
        travelers = IntentParser._parse_travelers(message)
        if travelers:
            constraints["travelers"] = travelers
        
        # Parse amenities/constraints
        amenities = IntentParser._parse_amenities(message)
        if amenities:
            constraints["amenities"] = amenities
        
        # Parse preferences
        preferences = IntentParser._parse_preferences(message)
        constraints.update(preferences)
        
        return constraints
    
    @staticmethod
    def _parse_dates(text: str) -> Optional[Dict[str, Any]]:
        """Parse dates from text"""
        # Simple date patterns
        month_patterns = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        
        # Look for month + day patterns
        for month_name, month_num in month_patterns.items():
            pattern = rf"{month_name}\s+(\d{{1,2}})[\s–-]+(\d{{1,2}})"
            match = re.search(pattern, text.lower())
            if match:
                start_day = int(match.group(1))
                end_day = int(match.group(2))
                year = datetime.now().year
                if month_num < datetime.now().month:
                    year += 1
                return {
                    "check_in": datetime(year, month_num, start_day).isoformat(),
                    "check_out": datetime(year, month_num, end_day).isoformat()
                }
        
        return None
    
    @staticmethod
    def _parse_origin(text: str) -> Optional[str]:
        """Parse origin airport/city"""
        # Look for "from X" or "X to" patterns
        patterns = [
            r"from\s+([A-Z]{3})",  # Airport code
            r"from\s+([A-Z][a-z]+)",  # City name
            r"([A-Z]{3})\s+to",  # Airport code before "to"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).upper()
        
        return None
    
    @staticmethod
    def _parse_destination(text: str) -> Optional[str]:
        """Parse destination"""
        # Look for "to X" or "anywhere X" patterns
        patterns = [
            r"to\s+([A-Z]{3})",  # Airport code
            r"to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",  # City name
            r"anywhere\s+([a-z]+)",  # "anywhere warm", "anywhere sunny"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                dest = match.group(1)
                # Handle "anywhere warm" -> return None (any destination)
                if "warm" in dest or "sunny" in dest or "beach" in dest:
                    return None  # Any warm destination
                return dest.upper() if len(dest) == 3 else dest.title()
        
        return None
    
    @staticmethod
    def _parse_budget(text: str) -> Optional[float]:
        """Parse budget amount"""
        # Look for "$X" or "budget $X" patterns
        patterns = [
            r"\$(\d{1,3}(?:,\d{3})*)",
            r"budget\s+\$?(\d{1,3}(?:,\d{3})*)",
            r"under\s+\$?(\d{1,3}(?:,\d{3})*)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                amount_str = match.group(1).replace(",", "")
                return float(amount_str)
        
        return None
    
    @staticmethod
    def _parse_travelers(text: str) -> Optional[int]:
        """Parse number of travelers"""
        patterns = [
            r"for\s+(\d+)\s+(?:people|travelers|guests|persons)",
            r"(\d+)\s+(?:people|travelers|guests|persons)",
            r"for\s+(\d+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))
        
        return None
    
    @staticmethod
    def _parse_amenities(text: str) -> List[str]:
        """Parse amenities/constraints"""
        amenities = []
        text_lower = text.lower()
        
        amenity_map = {
            "pet": "Pet-friendly",
            "pet-friendly": "Pet-friendly",
            "pets": "Pet-friendly",
            "breakfast": "Breakfast",
            "transit": "Near transit",
            "public transport": "Near transit",
            "metro": "Near transit",
            "refundable": "Refundable",
            "refund": "Refundable",
            "cancellation": "Refundable",
            "cancel": "Refundable",
        }
        
        for keyword, tag in amenity_map.items():
            if keyword in text_lower:
                amenities.append(tag)
        
        return amenities
    
    @staticmethod
    def _parse_preferences(text: str) -> Dict[str, Any]:
        """Parse other preferences"""
        preferences = {}
        text_lower = text.lower()
        
        # Avoid red-eye flights
        if "red-eye" in text_lower or "redeye" in text_lower:
            preferences["avoid_redeye"] = True
        
        # Direct flights preference
        if "direct" in text_lower or "nonstop" in text_lower:
            preferences["prefer_direct"] = True
        
        # Weekend preference
        if "weekend" in text_lower:
            preferences["weekend"] = True
        
        return preferences
    
    @staticmethod
    def needs_clarification(constraints: Dict[str, Any]) -> Optional[str]:
        """
        Determine if we need to ask a clarifying question
        Maximum of one clarifying question
        """
        if not constraints.get("check_in") or not constraints.get("check_out"):
            return "What are your travel dates?"
        
        if not constraints.get("origin"):
            return "Where are you traveling from?"
        
        if not constraints.get("budget"):
            return "What's your total budget for this trip?"
        
        return None  # Have enough information

