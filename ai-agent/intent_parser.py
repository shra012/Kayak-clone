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
        
        # Detect intent type
        if any(word in message_lower for word in ["flight", "fly", "flying"]):
            constraints["intent_type"] = "flight"
        elif any(word in message_lower for word in ["hotel", "stay", "accommodation", "room"]):
            constraints["intent_type"] = "hotel"
        elif any(word in message_lower for word in ["car", "rental", "rent a car"]):
            constraints["intent_type"] = "car"
        elif "bundle" in message_lower or "package" in message_lower:
            constraints["intent_type"] = "bundle"
        
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
        month_patterns = {
            "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
            "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
            "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "september": 9,
            "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12
        }
        
        text_lower = text.lower()
        
        # Pattern 1: "from December 15 to December 20" or "from Dec 15 to Dec 20"
        for month1, num1 in month_patterns.items():
            for month2, num2 in month_patterns.items():
                # Try with "from...to" first
                pattern = rf"from\s+{month1}\s+(\d{{1,2}})\s+to\s+{month2}\s+(\d{{1,2}})"
                match = re.search(pattern, text_lower)
                if match:
                    start_day = int(match.group(1))
                    end_day = int(match.group(2))
                    year = datetime.now().year
                    if num1 < datetime.now().month:
                        year += 1
                    return {
                        "check_in": datetime(year, num1, start_day).isoformat(),
                        "check_out": datetime(year, num2, end_day).isoformat()
                    }
                
                # Try without "from"
                pattern = rf"{month1}\s+(\d{{1,2}})\s+to\s+{month2}\s+(\d{{1,2}})"
                match = re.search(pattern, text_lower)
                if match:
                    start_day = int(match.group(1))
                    end_day = int(match.group(2))
                    year = datetime.now().year
                    if num1 < datetime.now().month:
                        year += 1
                    return {
                        "check_in": datetime(year, num1, start_day).isoformat(),
                        "check_out": datetime(year, num2, end_day).isoformat()
                    }
        
        # Pattern 2: "Oct 25-27" (same month)
        for month_name, month_num in month_patterns.items():
            pattern = rf"{month_name}\s+(\d{{1,2}})[\s–-]+(\d{{1,2}})"
            match = re.search(pattern, text_lower)
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
        # Skip if this is a date string
        month_names = ["january", "february", "march", "april", "may", "june", 
                       "july", "august", "september", "october", "november", "december",
                       "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        if any(month in text.lower() for month in month_names):
            return None
        
        text_upper = text.upper()
        
        # Pattern 1: "from LAX" or "from Los Angeles"
        from_match = re.search(r"from\s+([A-Z]{3}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", text, re.IGNORECASE)
        if from_match:
            origin = from_match.group(1)
            return origin.upper() if len(origin) == 3 else origin.title()
        
        # Pattern 2: "LAX to" (airport code before "to")
        to_match = re.search(r"([A-Z]{3})\s+to", text_upper)
        if to_match:
            return to_match.group(1)
        
        return None
    
    @staticmethod
    def _parse_destination(text: str) -> Optional[str]:
        """Parse destination"""
        # Skip if this is a date string
        month_names = ["january", "february", "march", "april", "may", "june", 
                       "july", "august", "september", "october", "november", "december",
                       "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        if any(month in text.lower() for month in month_names):
            return None
        
        # Pattern 1: "to SFO" or "to San Francisco"
        to_match = re.search(r"to\s+([A-Z]{3}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", text, re.IGNORECASE)
        if to_match:
            dest = to_match.group(1)
            # Handle vague destinations like "anywhere warm"
            if any(word in dest.lower() for word in ["warm", "sunny", "beach", "anywhere"]):
                return None
            return dest.upper() if len(dest) == 3 else dest.title()
        
        # Pattern 2: "in San Francisco" or "in SFO" (for hotels/cars)
        in_match = re.search(r"in\s+([A-Z]{3}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", text, re.IGNORECASE)
        if in_match:
            dest = in_match.group(1)
            if any(word in dest.lower() for word in ["warm", "sunny", "beach", "anywhere"]):
                return None
            return dest.upper() if len(dest) == 3 else dest.title()
        
        # Pattern 3: "anywhere warm/sunny"
        if "anywhere" in text.lower():
            return None  # User wants suggestions
        
        # Pattern 4: Standalone city name (when user just says "San Francisco" or "SFO")
        # Only match if it's basically the entire message (with common words filtered out)
        cleaned_text = text.strip()
        # Remove common filler words
        for filler in ["the", "a", "an", "please", "i want", "i need", "i'd like"]:
            cleaned_text = re.sub(rf"\b{filler}\b", "", cleaned_text, flags=re.IGNORECASE).strip()
        
        # Check if it looks like a city name (title case or uppercase) and is short enough
        if cleaned_text:
            # Airport code: 3 uppercase letters
            if re.match(r"^[A-Z]{3}$", cleaned_text):
                return cleaned_text
            # City name: 1-3 capitalized words
            city_match = re.match(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})$", cleaned_text)
            if city_match:
                return city_match.group(1)
        
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
        Determine if we need to ask a clarifying question based on travel type
        Returns most critical missing information first
        Budget is optional for simple searches
        """
        intent_type = constraints.get("intent_type", "")
        
        # For flight bookings - ask dates first, then route
        if "flight" in intent_type or "fly" in intent_type:
            if not constraints.get("check_in") or not constraints.get("check_out"):
                return "What are your travel dates?"
            if not constraints.get("origin"):
                return "Where are you flying from?"
            if not constraints.get("destination"):
                return "Where would you like to fly to?"
            # Budget optional for flights
            return None
        
        # For hotel/stay bookings - only need destination and dates
        elif "hotel" in intent_type or "stay" in intent_type:
            if not constraints.get("destination"):
                return "Which city are you looking to stay in?"
            if not constraints.get("check_in") or not constraints.get("check_out"):
                return "What are your check-in and check-out dates?"
            # Budget optional for hotels
            return None
        
        # For car rentals - need pickup location and dates
        elif "car" in intent_type:
            if not constraints.get("check_in") or not constraints.get("check_out"):
                return "What are your rental dates (pickup and return)?"
            if not constraints.get("destination"):
                return "Which city or airport do you need the car?"
            # Budget optional for car rentals
            return None
        
        # For bundles - need everything
        elif "bundle" in intent_type or "package" in intent_type:
            if not constraints.get("destination"):
                return "Where would you like to go?"
            if not constraints.get("check_in") or not constraints.get("check_out"):
                return "What are your travel dates?"
            if not constraints.get("origin"):
                return "Where are you traveling from?"
            if not constraints.get("budget"):
                return "What's your budget for this trip?"
            return None
        
        # For general travel - ask for essentials
        else:
            if not constraints.get("destination"):
                return "Where would you like to go?"
            if not constraints.get("check_in") or not constraints.get("check_out"):
                return "What are your travel dates?"
            return None

