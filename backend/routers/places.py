# ─── Places Router (Autocomplete + Nearby + Details) ───────────────────────────
# Google calls here use the Places API **v1 (New)** — `places.googleapis.com/v1`.
# There is no dependency on the legacy `maps.googleapis.com/maps/api/place/*`
# endpoints, so only "Places API (New)" needs to be enabled on the key.
import os
import re
import math
import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from limiter import limiter
from fastapi.responses import Response

GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
GEOAPIFY_KEY = os.getenv("GEOAPIFY_API_KEY", "")

router = APIRouter()


@router.get("/destination-image")
@limiter.limit("60/minute")
async def destination_image(request: Request, query: str = Query(..., min_length=2, max_length=100)):
    from services.destination_images import destination_image as resolve_image
    return await resolve_image(query)

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
    """Provider-backed suggestions; outages must not look like zero matches."""
    query = input.strip()[:100]
    if len(query) < 2:
        return {"predictions": []}
    query = {"ddn": "Dehradun", "dehra dun": "Dehradun"}.get(query.lower(), query)
    if not GEOAPIFY_KEY:
        raise HTTPException(503, "City search is temporarily unavailable")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.geoapify.com/v1/geocode/autocomplete", params={
                "text": query, "filter": "countrycode:in", "lang": "en",
                "limit": 6, "apiKey": GEOAPIFY_KEY,
            })
            resp.raise_for_status()
            data = resp.json()
        predictions = []
        for feature in data.get("features", []):
            p = feature.get("properties") or {}
            name = p.get("city") or p.get("name") or p.get("formatted")
            if not name or not p.get("place_id"):
                continue
            predictions.append({
                "description": name,
                "place_id": str(p.get("place_id", "")),
                "sub": p.get("state") or p.get("formatted") or "India",
                "lat": p.get("lat"), "lng": p.get("lon"),
            })
        return {"predictions": predictions, "source": "Geoapify / OpenStreetMap"}
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        # Provider exceptions can contain the credential-bearing request URL.
        raise HTTPException(503, "City search is temporarily unavailable") from None


@router.get("/")
async def nearby_places(lat: float = Query(9.9312, ge=-90, le=90), lng: float = Query(76.2673, ge=-180, le=180), type: str = "tourist_attraction", radius: int = Query(5000, ge=1, le=50000)):
    """Category search within the actual requested radius."""
    places = await _geoapify_places(lat, lng, type, radius)
    return {"places": places, "source": "Geoapify / OpenStreetMap"}


async def _geoapify_places(lat: float, lng: float, place_type: str, radius: int, query: str = ""):
    categories = {
        "tourist_attraction": "tourism.sights,tourism.attraction,heritage,leisure.park",
        "restaurant": "catering.restaurant,catering.cafe",
        "hotel": "accommodation.hotel,accommodation.guest_house",
        "park": "leisure.park", "museum": "entertainment.museum",
    }
    if not GEOAPIFY_KEY:
        raise HTTPException(503, "Nearby places are temporarily unavailable")
    if not math.isfinite(lat) or not math.isfinite(lng) or abs(lat) > 90 or abs(lng) > 180:
        raise HTTPException(422, "Invalid location")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.geoapify.com/v2/places", params={
                "categories": categories.get(place_type, categories["tourist_attraction"]),
                "filter": f"circle:{lng},{lat},{max(1, min(radius, 50000))}",
                "bias": f"proximity:{lng},{lat}", "limit": 20, "apiKey": GEOAPIFY_KEY,
                **({"name": query[:100]} if query else {}),
            })
            resp.raise_for_status()
            data = resp.json()
        places = []
        for feature in data.get("features", []):
            p = feature.get("properties") or {}
            if not p.get("name") or not p.get("place_id"):
                continue
            places.append({"id": p["place_id"], "placeId": p["place_id"],
                "name": p["name"], "vicinity": p.get("formatted") or "",
                "lat": p.get("lat"), "lng": p.get("lon"), "photo": None,
                "types": p.get("categories") or [], "source": "Geoapify / OpenStreetMap"})
        return places
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        raise HTTPException(503, "Nearby places are temporarily unavailable") from None


@router.get("/details")
async def place_details(lat: float = 20.5937, lng: float = 78.9629, type: str = "restaurant", query: str = "", radius: int = 5000):
    """Place details using Google Places API v1 (New).

    With a free-text `query` we call `places:searchText`, which is the only
    New-API endpoint that can resolve a named place. Without one we call
    `places:searchNearby`, which is type-based and has no keyword parameter.
    """
    if not GOOGLE_PLACES_KEY:
        results = await _geoapify_places(lat, lng, type, radius, query)
        return {"success": True, "results": results, "source": "Geoapify / OpenStreetMap"}

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
                    "Referer": "https://naviigo.in/",
                },
                json=body,
            )

        try:
            data = resp.json()
        except Exception:
            data = {}

        if resp.status_code != 200:
            results = await _geoapify_places(lat, lng, type, radius, query)
            return {"success": True, "results": results, "source": "Geoapify / OpenStreetMap"}

        places = data.get("places") or []
        results = [_normalize_place(place) for place in places[:10]]

        return {"success": True, "results": results, "total": len(places)}
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        results = await _geoapify_places(lat, lng, type, radius, query)
        return {"success": True, "results": results, "source": "Geoapify / OpenStreetMap"}


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
            resp = await client.get(url, headers={"Referer": "https://naviigo.in/"})
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Photo unavailable")
        return Response(content=resp.content, media_type=resp.headers.get("content-type", "image/jpeg"))
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Places] Photo proxy error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch photo")


@router.get("/osm/verify")
async def verify_osm():
    """Verify OpenStreetMap credentials and connectivity."""
    from services.osm_service import verify_osm_credentials, get_osm_auth_url
    result = await verify_osm_credentials()
    auth_url = ""
    try:
        auth_url = get_osm_auth_url(redirect_uri="http://localhost:8000/api/osm/callback")
    except Exception:
        auth_url = "unavailable"
    return {
        "success": result.get("valid", False),
        "service": "OpenStreetMap (OSM)",
        "verification": result,
        "sample_auth_url": auth_url,
    }
