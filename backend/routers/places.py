# ─── Places Router (Autocomplete + Nearby + Details) ───────────────────────────
# Google calls here use the Places API **v1 (New)** — `places.googleapis.com/v1`.
# There is no dependency on the legacy `maps.googleapis.com/maps/api/place/*`
# endpoints, so only "Places API (New)" needs to be enabled on the key.
import os
import re
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")

router = APIRouter()

# ── Places API (New) constants ────────────────────────────────────────────────
PLACES_API_BASE = "https://places.googleapis.com/v1"
MAX_CIRCLE_RADIUS = 50_000   # New API ceiling for a circle, in metres
MAX_RESULT_COUNT = 20        # New API ceiling for searchText / searchNearby

# The New API bills by requested field, so the mask must stay minimal.
# Widening it can move the call into a more expensive SKU.
PLACE_FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.shortFormattedAddress",
    "places.location",
    "places.regularOpeningHours.openNow",
    "places.types",
    "places.photos.name",
])

# Photo handles are resource names: `places/{placeId}/photos/{photoId}`.
# Both segments are URL-safe identifiers, so rejecting `.` and `/` beyond the
# two literal separators is what stops a caller-supplied name from escaping
# into another path on places.googleapis.com.
_PHOTO_NAME_RE = re.compile(r"^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+$")

_PRICE_LEVELS = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}


def _is_valid_photo_name(name: str) -> bool:
    return bool(name) and len(name) <= 512 and _PHOTO_NAME_RE.match(name) is not None


def _api_error(payload: dict, status: int) -> str:
    """Human-readable message for a failed New-API call."""
    message = ((payload or {}).get("error") or {}).get("message")
    return f"{status} {message}" if message else f"HTTP {status}"


def _normalize_place(place: dict) -> dict:
    """Flattens a New-API place object into the shape the UI already consumes."""
    photos = place.get("photos") or []
    photo_name = photos[0].get("name") if photos else None
    price = _PRICE_LEVELS.get(place.get("priceLevel"))
    return {
        "id": place.get("id"),
        "name": (place.get("displayName") or {}).get("text"),
        "rating": place.get("rating", 0) or 0,
        "userRatingsTotal": place.get("userRatingCount", 0) or 0,
        "priceLevel": price,
        "vicinity": place.get("shortFormattedAddress"),
        "lat": (place.get("location") or {}).get("latitude"),
        "lng": (place.get("location") or {}).get("longitude"),
        "isOpen": (place.get("regularOpeningHours") or {}).get("openNow"),
        "types": place.get("types") or [],
        "photo": (
            f"/api/places/photo?name={photo_name}&maxwidth=400"
            if _is_valid_photo_name(photo_name) else None
        ),
    }


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
    """Place details using Google Places API v1 (New).

    With a free-text `query` we call `places:searchText`, which is the only
    New-API endpoint that can resolve a named place. Without one we call
    `places:searchNearby`, which is type-based and has no keyword parameter.
    """
    if not GOOGLE_PLACES_KEY:
        return {"success": True, "results": [], "_note": "No Google Places API key configured"}

    radius = max(1, min(int(radius), MAX_CIRCLE_RADIUS))
    query = (query or "").strip()[:100]
    center = {"latitude": lat, "longitude": lng}

    if query:
        path = "places:searchText"
        body = {
            "textQuery": query,
            "maxResultCount": MAX_RESULT_COUNT,
            "locationBias": {"circle": {"center": center, "radius": radius}},
        }
    else:
        path = "places:searchNearby"
        body = {
            "includedTypes": [type],
            "maxResultCount": MAX_RESULT_COUNT,
            "locationRestriction": {"circle": {"center": center, "radius": radius}},
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{PLACES_API_BASE}/{path}",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_KEY,
                    "X-Goog-FieldMask": PLACE_FIELD_MASK,
                },
                json=body,
            )

        try:
            data = resp.json()
        except Exception:
            data = {}

        if resp.status_code != 200:
            return {"success": True, "results": [], "_status": _api_error(data, resp.status_code)}

        places = data.get("places") or []
        results = [_normalize_place(place) for place in places[:10]]

        return {"success": True, "results": results, "total": len(places)}
    except Exception as e:
        return {"success": False, "results": [], "error": str(e)}


@router.get("/photo")
async def get_photo(name: str = "", maxwidth: int = 400):
    """Proxy Google Places (New) photos to hide the API key.

    `name` is a photo resource name (`places/{placeId}/photos/{photoId}`). It
    contains slashes, so it is passed as a query parameter rather than a path
    segment, and it is validated against a strict pattern before being
    interpolated into the upstream URL.
    """
    if not GOOGLE_PLACES_KEY:
        raise HTTPException(status_code=400, detail="No Google Places API key")

    if not _is_valid_photo_name(name):
        raise HTTPException(status_code=400, detail="Invalid photo name")

    width = max(100, min(int(maxwidth), 1600))
    url = f"{PLACES_API_BASE}/{name}/media?maxWidthPx={width}&key={GOOGLE_PLACES_KEY}"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Photo unavailable")
        return Response(content=resp.content, media_type=resp.headers.get("content-type", "image/jpeg"))
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Places] Photo proxy error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch photo")
