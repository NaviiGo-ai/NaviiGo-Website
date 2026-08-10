# ─── Itinerary Engine (Gemini-Powered) ──────────────────────────────────────────
import json
import re
import asyncio
from typing import Optional, Dict, Any
from services.gemini_client import get_client, GEMINI_MODEL, is_configured


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
    prompt = f"""You are an expert, local Indian travel guide. Return ONLY raw destination data for {dest_name}, India as strictly valid JSON (no markdown):
{{
  "description": "3-4 highly evocative sentences describing the local vibe, hidden gems, and heritage.",
  "avgCost": "₹X – ₹Y per day",
  "crowdLevel": "Low/Medium/High",
  "crowdNote": "Exact crowd alerts (e.g., 'Avoid temples between 11 AM - 3 PM due to massive crowds')",
  "logistics": {{ "flights": "airport info", "trains": "station info" }},
  "weather": {{}},
  "mapCenter": {{ "lat": number, "lng": number }},
  "highlights": [{{ "name": "Real Name", "img": "category_hint", "desc": "2 detailed sentences with entry fees, exact timings (e.g., '6:00 AM - 8:00 PM'), and best spots for photos.", "tags": ["Heritage"], "lat": number, "lng": number, "duration": "1-2 hrs" }}],
  "restaurants": [{{ "name": "Real Name", "img": "restaurant_scene", "desc": "1-2 sentences", "cuisine": "type", "priceRange": "₹X–₹Y", "rating": 4.8, "mustTry": "dish", "lat": number, "lng": number, "tags": ["Local"] }}],
  "hotels": [{{ "name": "Real Name", "img": "hotel_exterior", "desc": "1-2 sentences", "type": "Hotel/Resort/Hostel/Homestay", "priceRange": "₹X/night", "rating": 4.5, "amenities": ["WiFi"], "lat": number, "lng": number }}]
}}
Rules:
- Generate exactly 12-15 highlights, 6 restaurants, and 5 hotels to ensure a dense itinerary.
- Provide extremely realistic names, coordinates, and exact timings.
- For the "img" field, use a category hint from this list: temple_generic, heritage_scene, fort_exterior, palace_interior, beach_scene, nature_landscape, mountain_view, trekking_trail, market_bazaar, lake_view, garden_park, waterfall_cascade, sunset_view, museum_interior, spiritual_site, food_street, restaurant_scene, hotel_exterior, resort_pool.
- The "img" field helps the frontend resolve the right category of image — pick the most appropriate one for each place."""

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return _extract_json(response.text)
    except Exception as e:
        print(f"[GeminiData] Error generating data for {dest_name}: {str(e)[:120]}")
        raise  # Bubble up to with_retry


async def fetch_destination_data_with_gemini(dest_name: str, purpose: str, budget: int, days: int) -> Optional[Dict[str, Any]]:
    print(f"[GeminiEnrich] Generating full Gemini data for {dest_name}...")
    return await with_retry(lambda: _get_full_gemini_data(dest_name, purpose, budget, days))
