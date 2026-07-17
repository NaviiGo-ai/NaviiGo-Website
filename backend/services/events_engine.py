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
                return _mock_events(destination)

            data = resp.json()
            if data.get("events_results"):
                return [
                    {
                        "title": e.get("title", ""),
                        "date": e.get("date", {"start_date": "Upcoming", "when": "Check link for dates"}),
                        "address": e.get("address", []),
                        "link": e.get("link", f"https://www.google.com/search?q={query}"),
                        "description": e.get("description", "Join this exciting local event."),
                        "thumbnail": e.get("thumbnail", "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80"),
                        "venue": e.get("venue", {"name": "Local Venue"}),
                    }
                    for e in data["events_results"][:8]
                ]

    except Exception as e:
        print(f"[Events] SerpAPI request failed: {e}")

    return _mock_events(destination)


async def get_live_events(destination: str) -> List[Dict[str, Any]]:
    """Fetch live events for a destination — cached by destination (6h TTL)."""
    if not SERPAPI_KEY:
        print("[Events] No SerpAPI key. Returning mock events.")
        return _mock_events(destination)

    cache_key = destination.lower().strip().replace(" ", "_")

    result = await cached_gemini_call(
        cache_namespace="events",
        cache_key=cache_key,
        generator=lambda: _fetch_events_from_serp(destination),
        ttl_hours=6,  # Events change more frequently
    )

    return result or _mock_events(destination)


def _mock_events(destination: str) -> List[Dict[str, Any]]:
    return [
        {
            "title": f"Weekend Flea Market - {destination}",
            "date": {"start_date": "Sat, 10 AM", "when": "This Weekend"},
            "address": [f"Downtown {destination}"],
            "link": f"https://in.bookmyshow.com/explore/events-{destination.lower()}",
            "description": "Local artisans, indie pop-up stores, and street food all in one place.",
            "thumbnail": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80",
            "venue": {"name": "City Square"},
        },
        {
            "title": "Indie Music Gig",
            "date": {"start_date": "Fri, 8 PM", "when": "This Friday"},
            "address": [f"Cultural Center, {destination}"],
            "link": f"https://insider.in/{destination.lower()}",
            "description": "Live acoustic session featuring upcoming local artists.",
            "thumbnail": "https://images.unsplash.com/photo-1540039155733-d76e614847be?auto=format&fit=crop&w=800&q=80",
            "venue": {"name": "Cultural Center"},
        },
    ]
