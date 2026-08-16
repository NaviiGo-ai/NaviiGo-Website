"""
Prompt Builder Service
Encapsulates Gemini AI prompt construction logic for the FastAPI itinerary backend.
"""

from typing import Any, Dict, Optional

def build_itinerary_prompt(
    destination: str,
    days: int,
    budget: float,
    purpose: Optional[str] = None,
    group: Optional[str] = None,
    traveler_type: Optional[str] = None,
    preferences: Optional[Dict[str, Any]] = None,
    route_stops: Optional[list] = None
) -> str:
    purpose_str = f"Purpose: {purpose}." if purpose else ""
    group_str = f"Companion Group: {group}." if group else ""
    type_str = f"Traveler Style: {traveler_type}." if traveler_type else ""

    stops_str = ""
    if route_stops and len(route_stops) > 0:
        formatted = ", ".join([f"{s.get('name')} ({s.get('stayDays', 1)} days via {s.get('travelMode', 'train')})" for s in route_stops])
        stops_str = f"Multi-destination route stops: {formatted}."

    prompt = f"""
Act as an expert Indian travel planner. Generate a highly detailed, realistic, day-by-day itinerary for {destination} for {days} days with a total budget of ₹{budget}.
{purpose_str} {group_str} {type_str} {stops_str}

Return strict valid JSON matching this exact structure:
{{
  "destName": "{destination}",
  "description": "Engaging 2-sentence summary of the trip",
  "avgCost": "₹{budget}",
  "crowdLevel": "Moderate",
  "crowdNote": "Insightful crowd advisory for the trip",
  "logistics": "Transit recommendation",
  "weather": "Typical weather overview",
  "mapCenter": {{"lat": 20.5937, "lng": 78.9629}},
  "highlights": [
    {{"name": "Point of Interest", "desc": "Brief overview", "tags": ["must-see"], "lat": 20.59, "lng": 78.96, "duration": "2 hours"}}
  ],
  "restaurants": [
    {{"name": "Local Eatery", "desc": "Famous local food spot", "cuisine": "Regional", "priceRange": "₹300-600", "rating": 4.5, "mustTry": "Signature dish", "lat": 20.59, "lng": 78.96}}
  ],
  "hotels": [
    {{"name": "Recommended Hotel", "desc": "Comfortable stay option", "type": "Mid-range", "priceRange": "₹2000-4000/night", "rating": 4.6, "amenities": ["WiFi", "AC"]}}
  ],
  "dayPlans": [
    {{
      "day": 1,
      "title": "Arrival & Initial Exploration",
      "date": "Day 1",
      "weather": {{"rain": 10, "temp": "28°C", "condition": "Sunny"}},
      "activities": [
        {{
          "id": "act-1",
          "name": "Activity Name",
          "desc": "Detailed description",
          "time": "09:00 AM – 11:30 AM",
          "lat": 20.59,
          "lng": 78.96,
          "crowd": "Low",
          "crowdTip": "Best time to visit",
          "slot": "Morning",
          "tags": ["cultural"],
          "travelFromPrev": "15 mins by cab",
          "cost": "₹200",
          "bookingLink": "",
          "insiderTip": "Local tip for best experience",
          "category": "must-see",
          "entryFee": "₹50",
          "bestPhotoSpot": "Main courtyard",
          "nearbyGem": "Hidden cafe around the corner",
          "whatToWear": "Modest clothing"
        }}
      ]
    }}
  ]
}}
"""
    return prompt.strip()
