# ─── Itinerary Engine (Gemini-Powered) ──────────────────────────────────────────
# V2: Enriched prompt for curated, hidden-gem-rich destination data.
# Each highlight now includes category, insider tips, time-awareness,
# nearby micro-gems, and experiential activities.

import json
import re
import asyncio
from typing import Optional, Dict, Any
from services.gemini_client import get_client, GEMINI_MODEL, is_configured

# Cache schema version — bump this when the prompt changes significantly
# so the cache layer knows to re-fetch stale data.
DEST_DATA_VERSION = 2


async def with_retry(func, max_retries=2):
    """Retry a Gemini call with exponential backoff on 429 rate limits."""
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except Exception as e:
            error_str = str(e).lower()
            if ("429" in error_str or "too many requests" in error_str or "quota" in error_str):
                if attempt < max_retries:
                    delay = (2 ** attempt) * 3
                    print(f"[Gemini] Rate limited. Retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
            print(f"[Gemini] Failed after retries: {str(e)[:120]}")
            return None
    return None


def _extract_json(text: str) -> Optional[dict]:
    """Extract JSON from a Gemini response that may be wrapped in markdown."""
    json_str = text
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if json_match:
        json_str = json_match.group(1)
    brace_match = re.search(r"\{[\s\S]*\}", json_str)
    if brace_match:
        json_str = brace_match.group(0)
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[GeminiData] JSON Decode Error: {e}")
        raise ValueError(f"Invalid JSON: {e}")


async def _get_full_gemini_data(dest_name: str, purpose: str, budget: int, days: int) -> Optional[Dict[str, Any]]:
    if not is_configured():
        print("[GeminiData] No GEMINI_API_KEY configured")
        return None

    client = get_client()

    prompt = f"""You are a hyper-local Indian travel expert who has lived in {dest_name} for 20 years. You know every hidden lane, every sunrise viewpoint that tourists miss, and every street food stall that locals swear by.

Return ONLY strictly valid JSON (no markdown, no comments) for {dest_name}, India:
{{
  "_v": {DEST_DATA_VERSION},
  "description": "4-5 evocative sentences. Mention specific neighborhoods, local slang, and the one thing that makes this place unforgettable.",
  "avgCost": "₹X – ₹Y per day",
  "crowdLevel": "Low/Medium/High",
  "crowdNote": "Hyper-specific crowd intel. E.g., 'The main ghat gets 3x busier after 9 AM — the south steps near Kedar Ghat stay empty until noon.'",
  "logistics": {{
    "flights": "Nearest airport with code, distance to city center, typical cab fare",
    "trains": "Main station name with code, which trains are best (e.g., 'Shatabdi from Delhi, 6h'), pre-paid auto rates from station"
  }},
  "weather": {{}},
  "mapCenter": {{ "lat": number, "lng": number }},
  "highlights": [
    {{
      "name": "Exact Real Name",
      "img": "category_hint",
      "desc": "3-4 rich sentences. Include what makes this special, the exact vibe (sounds, smells, atmosphere), and a specific detail only a local would know.",
      "tags": ["Heritage", "Culture"],
      "category": "must-see | hidden-gem | local-secret | experience",
      "lat": number,
      "lng": number,
      "duration": "1-2 hrs",
      "entryFee": "₹X or Free",
      "openingHours": "6:00 AM - 8:00 PM",
      "bestTimeToVisit": "sunrise | morning | afternoon | sunset | evening | night | any",
      "bestPhotoSpot": "Exact spot description, e.g., 'From the third arch on the left side, facing east'",
      "insiderTip": "A hyper-specific tip only a local would know. E.g., 'The security guard at Gate 3 lets you skip the main queue if you say you want to pray — it's the actual devotee entrance.'",
      "avoidTime": "11 AM - 2 PM (tour bus crush)" or null,
      "openDays": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      "nearbyGem": "Name of a tiny hidden spot within 500m worth a 15-min detour. E.g., 'Chai at Baba's stall (50m left of exit) — ₹15 for the best masala chai in the city.'" or null,
      "whatToWear": "Modest clothing required" or null
    }}
  ],
  "restaurants": [
    {{
      "name": "Real Name",
      "img": "category_hint",
      "desc": "2-3 sentences with atmosphere, signature experience, and a local-only ordering tip.",
      "cuisine": "type",
      "priceRange": "₹X–₹Y per person",
      "rating": 4.8,
      "mustTry": "Exact dish name with description",
      "lat": number,
      "lng": number,
      "tags": ["Local", "StreetFood"],
      "category": "fine-dining | casual | street-food | cafe | rooftop",
      "insiderTip": "E.g., 'Ask for the off-menu thali — regulars know about it. ₹180 for unlimited refills.'" or null,
      "bestTime": "lunch | dinner | anytime | breakfast"
    }}
  ],
  "hotels": [
    {{
      "name": "Real Name",
      "img": "category_hint",
      "desc": "2-3 sentences with specific room recommendation and location advantage.",
      "type": "Hotel/Resort/Hostel/Homestay",
      "priceRange": "₹X/night",
      "rating": 4.5,
      "amenities": ["WiFi", "Pool"],
      "lat": number,
      "lng": number,
      "insiderTip": "E.g., 'Ask for room 204 — it has the only balcony with a direct river view.'" or null
    }}
  ]
}}

CRITICAL RULES:
1. Generate exactly 18-22 highlights with this MIX:
   - 6-8 "must-see" (iconic attractions every visitor should see)
   - 5-7 "hidden-gem" (lesser-known spots that are genuinely special — NOT just less popular tourist spots)
   - 2-3 "local-secret" (places ONLY locals know — a specific viewpoint, a family-run workshop, a dawn ritual)
   - 3-4 "experience" (food walks, cooking classes, pottery workshops, sunrise yoga, photography walks, boat rides, cycling tours, night bazaar walks)
2. Generate exactly 8 restaurants with this MIX:
   - 2-3 street food stalls/carts (with exact location descriptions since they won't have addresses)
   - 2-3 casual/local restaurants (the kind a local would take a friend visiting for the first time)
   - 1-2 fine-dining or rooftop with views
   - 1 cafe/bakery for breakfast or afternoon break
3. Generate exactly 5 hotels across budget tiers.
4. Every coordinate must be REAL and accurate to 4 decimal places.
5. Every "insiderTip" must be genuinely useful and specific — NO generic advice like "go early" or "carry water."
6. For "img" field, use: temple_generic, heritage_scene, fort_exterior, palace_interior, beach_scene, nature_landscape, mountain_view, trekking_trail, market_bazaar, lake_view, garden_park, waterfall_cascade, sunset_view, museum_interior, spiritual_site, food_street, restaurant_scene, hotel_exterior, resort_pool, workshop_craft, night_scene, sunrise_view, cooking_class, boat_ride, cycling_tour.
7. "bestTimeToVisit" must reflect REAL local knowledge (e.g., sunrise for ghats, sunset for forts with west-facing views, morning for markets, evening for food streets).
8. "openDays" — if a place is closed on specific days (e.g., museums on Mondays), reflect that accurately."""

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
        )
        data = _extract_json(response.text)
        if data:
            data["_v"] = DEST_DATA_VERSION
        return data
    except Exception as e:
        print(f"[GeminiData] Error generating data for {dest_name}: {str(e)[:120]}")
        raise  # Bubble up to with_retry


async def fetch_destination_data_with_gemini(dest_name: str, purpose: str, budget: int, days: int) -> Optional[Dict[str, Any]]:
    print(f"[GeminiEnrich] Generating full Gemini data for {dest_name}...")
    return await with_retry(lambda: _get_full_gemini_data(dest_name, purpose, budget, days))
