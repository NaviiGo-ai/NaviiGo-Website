# ─── Events Engine (SerpAPI → Local Events) ────────────────────────────────────
import os
import httpx
from typing import List, Dict, Any
from services.gemini_cache import cached_gemini_call

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY", "")


async def _fetch_events_from_serp(destination: str) -> List[Dict[str, Any]]:
    """Raw SerpAPI call — only called on cache miss."""
    query = f"events in {destination}"
    url = f"https://serpapi.com/search.json?engine=google_events&q={query}&hl=en&gl=in"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params={"api_key": SERPAPI_KEY})
            if resp.status_code != 200:
                print(f"[Events] SerpAPI error: {resp.status_code}")
                return []

            data = resp.json()
            if data.get("events_results"):
                return [
                    {
                        "title": e.get("title", ""),
                        "date": e.get("date", {"start_date": "Upcoming", "when": "Check link for dates"}),
                        "address": e.get("address", []),
                        "link": e.get("link", f"https://www.google.com/search?q={query}"),
                        "description": e.get("description", ""),
                        "thumbnail": e.get("thumbnail", ""),
                        "venue": e.get("venue", {"name": ""}),
                    }
                    for e in data["events_results"][:8]
                ]

    except Exception as e:
        print(f"[Events] SerpAPI request failed: {e}")

    return []


async def get_live_events(destination: str) -> List[Dict[str, Any]]:
    """Fetch live events for a destination — cached by destination (6h TTL)."""
    if not SERPAPI_KEY:
        print("[Events] No SerpAPI key. Returning empty events.")
        return []

    cache_key = destination.lower().strip().replace(" ", "_")

    result = await cached_gemini_call(
        cache_namespace="events",
        cache_key=cache_key,
        generator=lambda: _fetch_events_from_serp(destination),
        ttl_hours=6,  # Events change more frequently
    )

    return result or []
