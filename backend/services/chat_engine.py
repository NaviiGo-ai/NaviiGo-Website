# ─── Chat Engine (Gemini-Powered Travel Assistant) ──────────────────────────────
import json
import re
import asyncio
from typing import Optional, Dict, Any, List
from services.gemini_client import get_client, GEMINI_MODEL, is_configured


async def process_chat(message: str, context: List[dict], itinerary_context: Optional[dict]) -> Dict[str, Any]:
    """Process a chat message and optionally return an itinerary action."""
    if not is_configured():
        return {
            "reply": "AI Chat is in demo mode. Add your GEMINI_API_KEY to .env.local to enable real AI responses.",
            "action": None,
        }

    client = get_client()
    itinerary_data = itinerary_context or {}

    system_context = f"""You are NaviiGo's AI travel assistant. You help users edit their travel itinerary with personality and flair.
Current itinerary:
- Destination: {itinerary_data.get('destName', 'Unknown')}
- Day plans: {json.dumps(itinerary_data.get('dayPlans', []), indent=2)}
- Highlights: {json.dumps([h.get('name', '') for h in itinerary_data.get('highlights', [])], indent=2)}
- Restaurants: {json.dumps([r.get('name', '') for r in itinerary_data.get('restaurants', [])], indent=2)}

Conversation: {json.dumps(context or [], indent=2)}

You can either:
1. Just reply with a helpful message (action: null)
2. Reply AND suggest an itinerary change (return action with type + payload)

Supported action types:
- "removeActivity": {{ dayIndex: number, activityIndex: number }}
- "addActivity": {{ dayIndex: number, activity: {{ name, desc, time, slot, crowd, crowdTip, lat, lng, type }} }}
- "reorderDay": {{ dayIndex: number, fromIndex: number, toIndex: number }}
- "replaceActivity": {{ dayIndex: number, activityIndex: number, activity: {{ name, desc, time, slot, crowd, crowdTip, lat, lng, type }} }}
- "addDay": {{ day: {{ day: number, title: string, activities: [...] }} }}
- "changeHotel": {{ hotelIndex: number, newHotel: {{ name, desc, type, priceRange, rating, amenities }} }}
- "swapRestaurant": {{ dayIndex: number, activityIndex: number, newRestaurant: {{ name, desc, cuisine, mustTry }} }}
- "surpriseActivity": {{ dayIndex: number }} - replace a random activity with something offbeat/hidden gem

Be warm, fun and helpful. When editing, explain WHY the change is better.
Respond with ONLY valid JSON:
{{
  "reply": "Natural conversational reply",
  "action": null | {{ "type": "...", "payload": {{...}} }}
}}"""

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=system_context + "\n\nUser: " + message,
        )
        text = response.text

        json_match = re.search(r"\{[\s\S]*\}", text)
        if not json_match:
            return {"reply": text, "action": None}

        return json.loads(json_match.group(0))
    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return {"reply": "I'm having trouble right now. Please try again in a moment.", "action": None}
