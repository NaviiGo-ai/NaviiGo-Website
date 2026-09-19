# ─── Entity Grounding Engine (Google Places v1 + OSM Nominatim) ───────────────
# Validates and enriches attractions, restaurants, and hotels with real-world
# coordinates, ratings, reviews, and operating status.
# 7-day TTL file cache + memory cache to minimize external latency and cost.

import os
import re
import json
import time
import asyncio
import threading
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx

GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
PLACES_API_BASE = "https://places.googleapis.com/v1"
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

BASE_DIR = Path(__file__).resolve().parent.parent
PLACES_CACHE_DIR = BASE_DIR / "cache" / "places"
PLACES_CACHE_DIR.mkdir(parents=True, exist_ok=True)

GROUNDING_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days

_mem_places: Dict[str, Dict[str, Any]] = {}
_mem_lock = threading.Lock()
_disk_lock = threading.Lock()


def _normalize_place_key(name: str, dest_name: str = "") -> str:
    combined = f"{dest_name}_{name}".strip().lower()
    return re.sub(r'[^a-z0-9]+', '_', combined).strip('_')


def _get_cached_grounding(key: str) -> Optional[Dict[str, Any]]:
    with _mem_lock:
        if key in _mem_places:
            entry = _mem_places[key]
            if time.time() - entry.get("ts", 0) < GROUNDING_TTL_SECONDS:
                return entry.get("data")

    cache_file = PLACES_CACHE_DIR / f"{key}.json"
    if cache_file.exists():
        try:
            with _disk_lock:
                stat = cache_file.stat()
                if time.time() - stat.st_mtime < GROUNDING_TTL_SECONDS:
                    with open(cache_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    with _mem_lock:
                        _mem_places[key] = {"data": data, "ts": time.time()}
                    return data
        except Exception:
            pass
    return None


def _set_cached_grounding(key: str, data: Dict[str, Any]):
    with _mem_lock:
        _mem_places[key] = {"data": data, "ts": time.time()}
    cache_file = PLACES_CACHE_DIR / f"{key}.json"
    try:
        with _disk_lock:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
    except Exception:
        pass


async def ground_place(
    name: str,
    dest_name: str = "",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    category: str = "attraction",
) -> Dict[str, Any]:
    """
    Ground a single place with Google Places API v1 (New) or OpenStreetMap Nominatim.
    Returns dictionary with verified coordinates, rating, address, and place ID.
    """
    if not name or len(name.strip()) < 2:
        return {"grounded": False, "name": name, "lat": lat, "lng": lng}

    clean_name = name.strip()
    key = _normalize_place_key(clean_name, dest_name)
    cached = _get_cached_grounding(key)
    if cached:
        return cached

    query = f"{clean_name}, {dest_name}, India" if dest_name else f"{clean_name}, India"

    # ── Try Google Places v1 (New) ──
    if GOOGLE_PLACES_KEY:
        try:
            body: Dict[str, Any] = {
                "textQuery": query,
                "maxResultCount": 1,
            }
            if lat is not None and lng is not None:
                body["locationBias"] = {
                    "circle": {
                        "center": {"latitude": lat, "longitude": lng},
                        "radius": 30000.0,
                    }
                }

            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.post(
                    f"{PLACES_API_BASE}/places:searchText",
                    headers={
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_PLACES_KEY,
                        "X-Goog-FieldMask": PLACE_FIELD_MASK,
                        "Referer": "https://naviigo.in/",
                    },
                    json=body,
                )

            if resp.status_code == 200:
                data = resp.json()
                places = data.get("places") or []
                if places:
                    p = places[0]
                    loc = p.get("location") or {}
                    res = {
                        "grounded": True,
                        "source": "google_places_v1",
                        "placeId": p.get("id"),
                        "name": (p.get("displayName") or {}).get("text") or clean_name,
                        "lat": loc.get("latitude", lat),
                        "lng": loc.get("longitude", lng),
                        "rating": p.get("rating"),
                        "userRatingsTotal": p.get("userRatingCount"),
                        "address": p.get("shortFormattedAddress"),
                        "isOpen": (p.get("regularOpeningHours") or {}).get("openNow"),
                        "types": p.get("types", []),
                    }
                    _set_cached_grounding(key, res)
                    return res
        except Exception as e:
            # Fall through to OSM
            pass

    # ── Fallback: OpenStreetMap (Nominatim) ──
    try:
        osm_query = f"{clean_name}, {dest_name}" if dest_name else clean_name
        url = f"https://nominatim.openstreetmap.org/search?q={osm_query}&format=json&addressdetails=1&limit=1&countrycodes=in"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url, headers={"User-Agent": "NaviiGo/1.0 (travel-app-grounding)"})
        if resp.status_code == 200:
            osm_data = resp.json()
            if osm_data and len(osm_data) > 0:
                p = osm_data[0]
                res = {
                    "grounded": True,
                    "source": "osm_nominatim",
                    "placeId": str(p.get("place_id")),
                    "name": clean_name,
                    "lat": float(p.get("lat", lat or 0.0)),
                    "lng": float(p.get("lon", lng or 0.0)),
                    "address": p.get("display_name"),
                    "rating": None,
                    "isOpen": None,
                }
                _set_cached_grounding(key, res)
                return res
    except Exception:
        pass

    # Fallback to ungrounded default
    fallback = {
        "grounded": False,
        "name": clean_name,
        "lat": lat,
        "lng": lng,
    }
    _set_cached_grounding(key, fallback)
    return fallback


async def ground_entities_batch(
    entities: List[Dict[str, Any]],
    dest_name: str = "",
    dest_lat: Optional[float] = None,
    dest_lng: Optional[float] = None,
    max_concurrency: int = 5,
) -> List[Dict[str, Any]]:
    """
    Ground multiple entities concurrently with rate-limiting.
    Enriches the entity dictionaries in-place or returns grounded copies.
    """
    sem = asyncio.Semaphore(max_concurrency)

    async def _ground_one(item: Dict[str, Any]):
        name = item.get("name", "")
        item_lat = item.get("lat", dest_lat)
        item_lng = item.get("lng", dest_lng)
        async with sem:
            grounded = await ground_place(
                name=name,
                dest_name=dest_name,
                lat=item_lat,
                lng=item_lng,
            )
            if grounded.get("grounded"):
                if grounded.get("lat") and grounded.get("lng"):
                    item["lat"] = grounded["lat"]
                    item["lng"] = grounded["lng"]
                if grounded.get("rating") is not None and not item.get("rating"):
                    item["rating"] = grounded["rating"]
                if grounded.get("placeId"):
                    item["googlePlaceId"] = grounded["placeId"]
                if grounded.get("address"):
                    item["formattedAddress"] = grounded["address"]
            return item

    tasks = [_ground_one(e) for e in entities if isinstance(e, dict) and e.get("name")]
    if not tasks:
        return entities
    return await asyncio.gather(*tasks, return_exceptions=False)
