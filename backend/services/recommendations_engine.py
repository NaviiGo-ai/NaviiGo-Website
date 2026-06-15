# ─── Recommendations Engine ─────────────────────────────────────────────────────
# Scores Indian destinations based on season, purpose, budget, group fit,
# user interests, and Pinecone vector similarity. Then optionally enhances
# with Gemini personalized pitch lines (cached).

import json
import re
import asyncio
import math
from datetime import datetime
from typing import Optional, Dict, Any, List
from services.gemini_client import get_client, GEMINI_MODEL, is_configured
from services.embeddings_engine import generate_embedding
from services.pinecone_engine import search_destinations_by_vibe
from services.gemini_cache import cached_gemini_call

# ── Destination metadata ──
DEST_META: Dict[str, Dict] = {
    "ladakh":    {"lat": 34.23, "lng": 77.56, "state": "Ladakh",           "types": ["adventure", "cultural"],           "idealMonths": [5,6,7,8,9]},
    "manali":    {"lat": 32.24, "lng": 77.19, "state": "Himachal Pradesh", "types": ["adventure", "honeymoon"],          "idealMonths": [3,4,5,6,10,11]},
    "kerala":    {"lat": 9.93,  "lng": 76.27, "state": "Kerala",           "types": ["leisure", "honeymoon"],            "idealMonths": [10,11,12,1,2,3]},
    "goa":       {"lat": 15.30, "lng": 74.12, "state": "Goa",              "types": ["leisure", "celebrate"],            "idealMonths": [11,12,1,2,3]},
    "jaipur":    {"lat": 26.91, "lng": 75.79, "state": "Rajasthan",        "types": ["cultural", "honeymoon"],           "idealMonths": [10,11,12,1,2]},
    "varanasi":  {"lat": 25.32, "lng": 83.01, "state": "UP",               "types": ["spiritual"],                      "idealMonths": [10,11,12,1,2]},
    "rishikesh": {"lat": 30.09, "lng": 78.27, "state": "Uttarakhand",      "types": ["spiritual", "adventure"],          "idealMonths": [3,4,5,9,10,11]},
    "andaman":   {"lat": 11.74, "lng": 92.66, "state": "Andaman",          "types": ["leisure", "honeymoon"],            "idealMonths": [11,12,1,2,3,4]},
    "darjeeling":{"lat": 27.04, "lng": 88.26, "state": "WB",               "types": ["leisure", "cultural"],             "idealMonths": [3,4,5,9,10,11]},
    "udaipur":   {"lat": 24.58, "lng": 73.68, "state": "Rajasthan",        "types": ["honeymoon", "cultural"],           "idealMonths": [10,11,12,1,2]},
    "coorg":     {"lat": 12.32, "lng": 75.81, "state": "Karnataka",        "types": ["leisure", "honeymoon"],            "idealMonths": [10,11,12,1,2,3]},
    "hampi":     {"lat": 15.34, "lng": 76.46, "state": "Karnataka",        "types": ["cultural"],                       "idealMonths": [10,11,12,1,2]},
    "shimla":    {"lat": 31.10, "lng": 77.17, "state": "Himachal Pradesh",  "types": ["leisure", "adventure"],            "idealMonths": [3,4,5,6,11,12]},
    "amritsar":  {"lat": 31.63, "lng": 74.87, "state": "Punjab",           "types": ["spiritual", "cultural"],           "idealMonths": [10,11,12,1,2,3]},
    "gangtok":   {"lat": 27.34, "lng": 88.61, "state": "Sikkim",           "types": ["adventure", "leisure"],            "idealMonths": [3,4,5,9,10,11]},
}

PRETTY_NAMES = {
    "ladakh": "Ladakh", "manali": "Manali", "kerala": "Kerala", "goa": "Goa",
    "jaipur": "Jaipur", "varanasi": "Varanasi", "rishikesh": "Rishikesh",
    "andaman": "Andaman", "darjeeling": "Darjeeling", "udaipur": "Udaipur",
    "coorg": "Coorg", "hampi": "Hampi", "shimla": "Shimla", "amritsar": "Amritsar", "gangtok": "Gangtok",
}

ESTIMATED_DAILY_MIN = {
    "andaman": 5000, "manali": 2500, "ladakh": 3000, "kerala": 3000,
    "goa": 3500, "jaipur": 2000, "varanasi": 1500, "rishikesh": 1800,
    "darjeeling": 2000, "udaipur": 2500, "coorg": 2500, "hampi": 1500,
    "shimla": 2000, "amritsar": 1800, "gangtok": 2500,
}

GROUP_FIT = {
    "solo":      ["rishikesh", "hampi", "varanasi", "darjeeling", "gangtok"],
    "couple":    ["udaipur", "coorg", "andaman", "kerala", "goa"],
    "family":    ["shimla", "manali", "jaipur", "amritsar", "kerala"],
    "friends":   ["goa", "rishikesh", "manali", "coorg", "ladakh"],
    "honeymoon": ["udaipur", "kerala", "andaman", "coorg", "goa"],
}

INTEREST_MAP = {
    "Trekking":     ["manali", "ladakh", "rishikesh", "darjeeling", "gangtok"],
    "Beaches":      ["goa", "andaman", "kerala"],
    "History":      ["jaipur", "hampi", "amritsar", "varanasi"],
    "Food":         ["amritsar", "jaipur", "kerala", "goa"],
    "Photography":  ["ladakh", "hampi", "jaipur", "varanasi", "darjeeling"],
    "Wellness":     ["rishikesh", "kerala", "coorg"],
    "Wildlife":     ["coorg", "kerala", "andaman"],
}

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]


async def _generate_pitches(top5: list, month_name: str, purpose: str, group: str) -> list:
    """Raw Gemini call to generate pitch lines — called only on cache miss."""
    client = get_client()
    prompt = f"""Create ultra-short personalized travel pitch lines for these Indian destinations for a traveler going in {month_name} with purpose "{purpose}" and group type "{group}".

Destinations: {', '.join(d['name'] for d in top5)}

Return ONLY JSON array (no markdown):
[
  {{ "id": "{top5[0]['id'] if top5 else ''}", "pitch": "One exciting sentence why this is perfect RIGHT NOW for them" }},
  ...
]"""
    response = await asyncio.to_thread(
        client.models.generate_content,
        model=GEMINI_MODEL,
        contents=prompt,
    )
    text = response.text
    arr_match = re.search(r"\[[\s\S]*\]", text)
    if arr_match:
        return json.loads(arr_match.group(0))
    return []


async def get_recommendations(
    budget: int = 15000,
    month: Optional[int] = None,
    group: Optional[str] = None,
    purpose: Optional[str] = None,
    preferences: Optional[dict] = None,
    past_destinations: Optional[List[str]] = None,
    taste_vector: Optional[List[float]] = None,
    browsing_signals: Optional[dict] = None,
) -> List[dict]:
    current_month = month or (datetime.now().month)
    budget_num = budget or 15000

    # ── Process Browsing Signals ──
    final_vector = taste_vector or []
    if browsing_signals:
        clicked = browsing_signals.get("clickedCategories", [])
        viewed = browsing_signals.get("viewedDestinations", [])
        if clicked or viewed:
            signal_text = f"User is implicitly interested in categories: {', '.join(clicked) if clicked else 'none'}. They recently viewed destinations: {', '.join(viewed) if viewed else 'none'}."
            signal_vector = await generate_embedding(signal_text)
            if signal_vector:
                if not final_vector:
                    final_vector = signal_vector
                elif len(final_vector) == len(signal_vector):
                    final_vector = [(v * 0.5) + (signal_vector[i] * 0.5) for i, v in enumerate(final_vector)]

    # ── Semantic matches from Pinecone ──
    semantic_matches = []
    if final_vector:
        semantic_matches = await search_destinations_by_vibe(final_vector, 15)

    # ── Score each destination ──
    scored = []
    for dest_id, meta in DEST_META.items():
        score = 50
        reasons = []

        # 1. Month/season fit
        month_fit = current_month in meta["idealMonths"]
        if month_fit:
            reasons.append(f"🗓️ Perfect season — {MONTH_NAMES[current_month - 1]} is ideal")
            score += 30
        else:
            score -= 10

        # 2. Purpose alignment
        if purpose and purpose in meta["types"]:
            score += 25
            reasons.append(f"🎯 Matches your {purpose} travel style")
        elif purpose:
            score -= 10

        # 3. Budget fit
        daily_min = ESTIMATED_DAILY_MIN.get(dest_id, 2000)
        if budget_num >= daily_min * 3:
            score += 15
            reasons.append(f"💰 Within your ₹{budget_num:,} budget")
        else:
            score -= 15

        # 4. Novelty boost
        if past_destinations and dest_id not in past_destinations:
            score += 10
            reasons.append("✨ New destination for you")

        # 5. Group fit
        group_dests = GROUP_FIT.get(group or "", [])
        if dest_id in group_dests:
            score += 15
            reasons.append(f"👥 Great for {group} travel")

        # 6. User interests
        if preferences and preferences.get("interests"):
            for interest in preferences["interests"]:
                if dest_id in INTEREST_MAP.get(interest, []):
                    score += 12
                    reasons.append(f"❤️ Matches your interest in {interest}")
                    break

        # 7. Vector semantic match
        if semantic_matches:
            vector_match = next((m for m in semantic_matches if m["id"] == dest_id), None)
            if vector_match:
                vector_boost = round(vector_match["score"] * 40)
                score += vector_boost
                if vector_boost > 25:
                    reasons.insert(0, "🔮 Perfect match for your unique travel taste!")

        scored.append({
            "id": dest_id,
            "name": PRETTY_NAMES.get(dest_id, dest_id),
            "score": score,
            "reasons": reasons[:3],
            "monthScore": 30 if month_fit else -10,
        })

    # Sort and cap
    scored.sort(key=lambda d: d["score"], reverse=True)
    top5 = scored[:5]
    top5 = [{**d, "score": min(99, max(50, d["score"]))} for d in top5]

    # ── Gemini personalized pitches (CACHED) ──
    if is_configured():
        month_name = MONTH_NAMES[current_month - 1] if 1 <= current_month <= 12 else "this month"
        
        # Budget tier for cache key — exact budget doesn't matter for pitches
        budget_tier = "luxury" if budget_num > 25000 else ("mid" if budget_num > 8000 else "budget")
        dest_ids_key = "_".join(d["id"] for d in top5)
        cache_key = f"{dest_ids_key}_{month_name}_{purpose}_{group}_{budget_tier}"

        pitches = await cached_gemini_call(
            cache_namespace="recommendations",
            cache_key=cache_key,
            generator=lambda: _generate_pitches(top5, month_name, purpose, group),
            ttl_hours=24,
        )

        if pitches:
            pitch_map = {p["id"]: p.get("pitch", "") for p in pitches}
            top5 = [{**d, "pitch": pitch_map.get(d["id"], "")} for d in top5]

    return top5
