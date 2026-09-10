# ─── Places Router (Autocomplete + Nearby + Details) ───────────────────────────
import os
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

router = APIRouter()


@router.get("/autocomplete")
async def autocomplete(input: str = ""):
    """Place autocomplete using Nominatim (OpenStreetMap) — free, no key."""
    if len(input) < 2:
        return {"predictions": []}

    try:
        url = f"https://nominatim.openstreetmap.org/search?q={input}&format=json&addressdetails=1&limit=6&countrycodes=in"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers={"User-Agent": "NaviiGo/1.0 (travel-app)"})
            data = resp.json()

        predictions = []
        for p in (data or []):
            parts = (p.get("display_name") or "").split(",")
            city_name = parts[0].strip() if parts else "Unknown"
            region = ", ".join(p.strip() for p in parts[1:3]) if len(parts) > 1 else "India"
            predictions.append({
                "description": city_name,
                "place_id": str(p.get("place_id", "")),
                "sub": (p.get("address") or {}).get("state", region),
            })
        return {"predictions": predictions}
    except Exception as e:
        print(f"[Autocomplete] Error: {e}")
        return {"predictions": []}


@router.get("/")
async def nearby_places(lat: float = 9.9312, lng: float = 76.2673, type: str = "tourist_attraction", radius: int = 5000):
    """Nearby places using Nominatim."""
    try:
        nominatim_url = (
            f"https://nominatim.openstreetmap.org/search?"
            f"q={type.replace('_', ' ')}&format=json&limit=6&bounded=1"
            f"&viewbox={lng - 0.05},{lat + 0.05},{lng + 0.05},{lat - 0.05}"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(nominatim_url, headers={"User-Agent": "NaviiGo/1.0 (travel-app)"})
            data = resp.json()

        if data:
            places = [{
                "name": (p.get("display_name") or "Unknown Place").split(",")[0],
                "vicinity": ", ".join(p.get("display_name", "").split(",")[1:3]).strip() or "Nearby",
                "type": type.replace("_", " "),
                "priceLevel": 1,
                "placeId": str(p.get("place_id", "")),
                "photo": None,
                "lat": float(p["lat"]),
                "lng": float(p["lon"]),
            } for p in data]
            return {"places": places}
    except Exception as e:
        print(f"[Places] Error: {e}")

    return {"places": []}


@router.get("/details")
async def place_details(lat: float = 20.5937, lng: float = 78.9629, type: str = "restaurant", query: str = "", radius: int = 5000):
    """Place details using Google Places API (if key available)."""
    if not GOOGLE_PLACES_KEY:
        return {"success": True, "results": [], "_note": "No Google Places API key configured"}

    try:
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={lat},{lng}&radius={radius}&type={type}"
            f"{'&keyword=' + query if query else ''}&key={GOOGLE_PLACES_KEY}"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            data = resp.json()

        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            return {"success": True, "results": [], "_status": data.get("status")}

        results = [{
            "id": place.get("place_id"),
            "name": place.get("name"),
            "rating": place.get("rating", 0),
            "userRatingsTotal": place.get("user_ratings_total", 0),
            "priceLevel": place.get("price_level"),
            "vicinity": place.get("vicinity"),
            "lat": place.get("geometry", {}).get("location", {}).get("lat"),
            "lng": place.get("geometry", {}).get("location", {}).get("lng"),
            "isOpen": (place.get("opening_hours") or {}).get("open_now"),
            "types": place.get("types", []),
            "photo": (
                f"/api/places/photo/{place['photos'][0]['photo_reference']}"
                if place.get("photos") else None
            ),
        } for place in (data.get("results") or [])[:10]]

        return {"success": True, "results": results, "total": len(data.get("results", []))}
    except Exception as e:
        return {"success": False, "results": [], "error": str(e)}


@router.get("/photo/{photo_reference}")
async def get_photo(photo_reference: str, maxwidth: int = 400):
    """Proxy Google Places photos to hide the API key."""
    if not GOOGLE_PLACES_KEY:
        raise HTTPException(status_code=400, detail="No Google Places API key")
    
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={maxwidth}&photoreference={photo_reference}&key={GOOGLE_PLACES_KEY}"
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
            return Response(content=resp.content, media_type=resp.headers.get("content-type", "image/jpeg"))
    except Exception as e:
        print(f"[Places] Photo proxy error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch photo")
