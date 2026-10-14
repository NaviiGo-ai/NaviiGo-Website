"""In-app price observations from the existing SerpApi account."""
import asyncio
import os
import time
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY", "")
_cache = {}
_lock = asyncio.Lock()


async def search_flights(origin: str, destination: str, date: str):
    if not SERPAPI_KEY or SERPAPI_KEY.startswith("your_"):
        raise HTTPException(503, "Flight prices are temporarily unavailable")
    key = (origin, destination, date)
    async with _lock:
        cached = _cache.get(key)
        if cached and cached[0] > time.monotonic():
            return cached[1]
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get("https://serpapi.com/search.json", params={
                    "engine": "google_flights", "departure_id": origin, "arrival_id": destination,
                    "outbound_date": date, "type": 2, "currency": "INR",
                    "hl": "en", "gl": "in", "api_key": SERPAPI_KEY,
                })
                response.raise_for_status()
                data = response.json()
                if data.get("error"):
                    raise HTTPException(503, "Flight prices are temporarily unavailable")
        except (httpx.HTTPError, ValueError):
            raise HTTPException(503, "Flight prices are temporarily unavailable") from None
        results = []
        seen = set()
        for item in (data.get("best_flights") or []) + (data.get("other_flights") or []):
            legs = item.get("flights") or []
            price = item.get("price")
            if not legs or not isinstance(price, (int, float)) or price <= 0:
                continue
            first, last = legs[0], legs[-1]
            departure = (first.get("departure_airport") or {}).get("time")
            arrival = (last.get("arrival_airport") or {}).get("time")
            identity = (first.get("flight_number"), departure, arrival, price)
            if identity in seen:
                continue
            seen.add(identity)
            results.append({"airline": first.get("airline") or "Airline",
                "flightNumber": first.get("flight_number"), "departure": departure,
                "arrival": arrival, "durationMinutes": item.get("total_duration"),
                "stops": len(legs) - 1, "price": price, "currency": "INR"})
        result = {"results": sorted(results, key=lambda item: item["price"])[:12],
            "source": "Google Flights via SerpApi", "observedAt": datetime.now(timezone.utc).isoformat(),
            "notice": "Observed one-way fares for one adult. Prices and availability can change before booking."}
        if len(_cache) >= 128:
            _cache.pop(next(iter(_cache)))
        _cache[key] = (time.monotonic() + 600, result)
        return result
