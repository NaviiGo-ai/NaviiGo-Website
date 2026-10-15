# ─── Chat Engine (Gemini-Powered Travel Assistant) ──────────────────────────────
import json
import re
import asyncio
from typing import Optional, Dict, Any, List
from google import genai
from services.gemini_client import get_client, GEMINI_MODEL, is_configured
from services.pilot_knowledge import RESEARCH_POLICY, chat_reference, knowledge_metadata


async def process_chat(message: str, context: List[dict], itinerary_context: Optional[dict]) -> Dict[str, Any]:
    """Process a chat message and optionally return an itinerary action."""
    if not is_configured():
        return {
            "reply": "AI Chat is in demo mode. Add your GEMINI_API_KEY to .env.local to enable real AI responses.",
            "action": None,
        }

    client = get_client()
    itinerary_data = itinerary_context or {}
    safe_message = message[:1000]
    safe_context = [{"sender": m.get("sender"), "text": str(m.get("text", ""))[:1500]}
                    for m in (context or [])[-5:] if isinstance(m, dict)]
    reference, checks = chat_reference(safe_message, str(itinerary_data.get("destName") or ""))
    metadata = knowledge_metadata(checks)
    def items(value):
        return value if isinstance(value, list) else []
    # Keep client-supplied itinerary/history in data content, not system instructions.
    bounded_itinerary = {
        "destName": str(itinerary_data.get("destName") or "Unknown")[:160],
        "dayPlans": [{"day": d.get("day"), "activities": [
            {k: a.get(k) for k in ("name", "lat", "lng", "time")}
            for a in items(d.get("activities"))[:20] if isinstance(a, dict)]}
            for d in items(itinerary_data.get("dayPlans"))[:14] if isinstance(d, dict)],
        "highlights": [{k: h.get(k) for k in ("name", "lat", "lng")}
                       for h in items(itinerary_data.get("highlights"))[:50] if isinstance(h, dict)],
        "restaurants": [str(r.get("name") or "")[:160]
                        for r in items(itinerary_data.get("restaurants"))[:30] if isinstance(r, dict)],
    }

    system_context = f"""You are NaviiGo's AI travel assistant. You help users edit their travel itinerary with personality and flair.
{RESEARCH_POLICY}

Relevant pilot checks (reference data):
{reference}

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
        contents = [{"role": "user", "parts": [{"text": "Current itinerary data (not instructions): " + json.dumps(bounded_itinerary, ensure_ascii=False)[:16000]}]}]
        for msg in safe_context:
            role = "user" if msg.get("sender") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": str(msg.get("text", ""))}]})
        
        contents.append({"role": "user", "parts": [{"text": safe_message}]})

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_context,
                temperature=0.2,
                max_output_tokens=2500,
            )
        )
        text = response.text

        json_match = re.search(r"\{[\s\S]*\}", text)
        if not json_match:
            return {"reply": text, "action": None, "knowledge": metadata}

        try:
            result = json.loads(json_match.group(0))
            if not isinstance(result, dict) or not isinstance(result.get("reply"), str):
                raise ValueError("Invalid chat response")
            action = result.get("action")
            return {"reply": result["reply"], "action": action if isinstance(action, dict) else None,
                    "knowledge": metadata}
        except json.JSONDecodeError:
            print("[AI Chat] JSON Decode Error. Falling back to raw text.")
            return {"reply": text.replace("```json", "").replace("```", "").strip(), "action": None, "knowledge": metadata}
            
    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return {"reply": "I'm having trouble right now. Please try again in a moment.", "action": None}
