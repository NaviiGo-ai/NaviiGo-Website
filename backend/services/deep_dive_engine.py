# ─── Deep Dive Engine (Explore Page) ────────────────────────────────────────────
import json
import re
import asyncio
from typing import Dict, Any
from services.gemini_client import get_client, GEMINI_MODEL, is_configured
from services.gemini_cache import cached_gemini_call


async def _generate_deep_dive(destination: str, companion: str, vibe: str) -> Dict[str, Any]:
    """Raw Gemini call for deep dive — called only on cache miss."""
    client = get_client()
    prompt = f"""You are an incredibly authentic and brutally honest local travel expert and Reddit travel community synthesizer.
The destination is: {destination}.
The traveler group is: {companion}.
Their primary goal/vibe is: {vibe}.

Respond strictly with a RAW VALID JSON object. Do not include markdown formatting like ```json. 
Provide highly specific and curated recommendations that reflect true local insights, not generic tourist brochures.

Must exactly match this structure:
{{
    "redditConsensus": "A 2-3 sentence brutally honest summary of what actual travelers (e.g. on Reddit) say about this city given the context of a {companion} trip.",
    "hiddenGems": [
        {{ "name": "Name of secret spot", "desc": "Why it's amazing and fits the vibe." }}
    ],
    "touristTrapsToAvoid": [
        {{ "trap": "Name of popular overrated spot", "betterAlternative": "The authentic alternative to go to instead." }}
    ],
    "instagramWorthy": [
        {{ "spot": "Name of aesthetic spot", "bestTime": "Best lighting/time to go" }}
    ],
    "localFoodMustHaves": [
        {{ "dish": "Name of specific local dish", "where": "Name of a highly rated specific local restaurant/stall to get it" }}
    ]
}}
Generate exactly 3 hiddenGems, 2 touristTrapsToAvoid, 3 instagramWorthy, 3 localFoodMustHaves."""

    response = await asyncio.to_thread(
        client.models.generate_content,
        model=GEMINI_MODEL,
        contents=prompt,
    )
    text = response.text.strip()

    # Clean markdown code blocks
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


async def get_deep_dive(destination: str, companion: str = "Solo", vibe: str = "Explore everything") -> Dict[str, Any]:
    """Generate an authentic deep-dive for a destination — cached by (dest, companion, vibe)."""
    if not is_configured():
        return _generic_fallback(destination)

    # Cache key: same destination + companion + vibe = same result
    cache_key = f"{destination.lower().strip()}_{companion.lower().strip()}_{vibe.lower().strip()[:30]}"

    result = await cached_gemini_call(
        cache_namespace="deep_dive",
        cache_key=cache_key,
        generator=lambda: _generate_deep_dive(destination, companion, vibe),
        ttl_hours=48,  # Deep dives don't change often
    )

    return result or _generic_fallback(destination)


def _generic_fallback(destination: str) -> Dict[str, Any]:
    return {
        "redditConsensus": f"{destination} is a treasure that travelers consistently recommend. Locals are friendly and the food scene is incredible. Plan 2-3 days minimum.",
        "hiddenGems": [
            {"name": f"{destination} Old Quarter Walk", "desc": "Explore the heritage lanes and local markets away from the main tourist circuit."},
            {"name": "Local Morning Market", "desc": "Wake up early and visit the morning market where locals shop."},
            {"name": "Sunset Viewpoint", "desc": "Ask any rickshaw driver for the best sunset spot."},
        ],
        "touristTrapsToAvoid": [
            {"trap": "Tour packages near major monuments", "betterAlternative": "Hire a local guide through your hotel."},
            {"trap": "Restaurants directly facing tourist landmarks", "betterAlternative": "Walk one street back — prices drop 60%."},
        ],
        "instagramWorthy": [
            {"spot": f"{destination}'s most iconic landmark", "bestTime": "Sunrise for golden light"},
            {"spot": "Heritage district streets", "bestTime": "Golden hour, 4:00–5:30 PM"},
            {"spot": "Local temple or spiritual site", "bestTime": "Evening when lamps are lit"},
        ],
        "localFoodMustHaves": [
            {"dish": "Regional specialty dish", "where": "Ask your hotel staff for the most popular local eatery"},
            {"dish": "Street-side chai & snacks", "where": "Nearest old market"},
            {"dish": "Traditional thali", "where": "Any family-run restaurant off the main road"},
        ],
    }
