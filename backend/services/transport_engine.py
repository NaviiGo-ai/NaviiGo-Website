# ─── Transport Engine (Geoapify + OSRM + Google Distance Matrix) ───────────────
import os
import math
import httpx
from typing import Dict, Any, Optional
from services.geoapify_service import calculate_route, is_geoapify_configured

GOOGLE_KEY = os.getenv("GOOGLE_DISTANCE_MATRIX_KEY", "")


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance in km between two points."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _get_osrm(from_lat: float, from_lng: float, to_lat: float, to_lng: float, mode: str = "car") -> Optional[Dict[str, Any]]:
    """Fetch distance/duration from OSRM (free)."""
    try:
        profile = "foot" if mode == "foot" else "car"
        url = f"https://router.project-osrm.org/route/v1/{profile}/{from_lng},{from_lat};{to_lng},{to_lat}?overview=false"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("code") != "Ok":
                return None
            return {
                "distanceM": data["routes"][0]["distance"],
                "durationS": data["routes"][0]["duration"],
                "source": "osrm",
            }
    except Exception:
        return None


async def get_transport(from_lat: Optional[float], from_lng: Optional[float], to_lat: Optional[float], to_lng: Optional[float]) -> Dict[str, Any]:
    """Get walking, auto, and cab estimates between two points with multi-provider routing."""
    if from_lat is None or from_lng is None or to_lat is None or to_lng is None:
        return {
            "distance": "Unknown",
            "options": [],
            "source": "none",
        }

    drive_data = None
    walk_data = None
    source = "haversine"

    # 1. Try Geoapify Routing
    if is_geoapify_configured():
        try:
            drive_data = await calculate_route(from_lat, from_lng, to_lat, to_lng, mode="drive")
            walk_data = await calculate_route(from_lat, from_lng, to_lat, to_lng, mode="walk")
            if drive_data:
                source = "geoapify_routing"
        except Exception:
            pass

    # 2. Try OSRM if Geoapify didn't return drive data
    if not drive_data:
        drive_data = await _get_osrm(from_lat, from_lng, to_lat, to_lng, "car")
        walk_data = await _get_osrm(from_lat, from_lng, to_lat, to_lng, "foot")
        if drive_data:
            source = "osrm"

    dist_km = (drive_data["distanceM"] / 1000) if drive_data else _haversine(from_lat, from_lng, to_lat, to_lng)
    drive_minutes = math.ceil(drive_data["durationS"] / 60) if drive_data else math.ceil(dist_km * 3)
    walk_minutes = math.ceil(walk_data["durationS"] / 60) if walk_data else math.ceil(dist_km * 12)

    auto_cost = max(30, round(dist_km * 12))
    cab_cost = max(60, round(dist_km * 18))

    # 3. Try Google Distance Matrix if key is present
    if GOOGLE_KEY and GOOGLE_KEY != "your_google_distance_matrix_key_here":
        try:
            gm_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={from_lat},{from_lng}&destinations={to_lat},{to_lng}&mode=driving&key={GOOGLE_KEY}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(gm_url)
                gm_data = resp.json()
                gm_row = gm_data.get("rows", [{}])[0].get("elements", [{}])[0]
                if gm_row.get("status") == "OK":
                    gm_dur = math.ceil(gm_row["duration"]["value"] / 60)
                    return {
                        "distance": gm_row["distance"]["text"],
                        "source": "google_distance_matrix",
                        "options": [
                            {"mode": "Walking", "emoji": "🚶", "duration": f"{walk_minutes} min", "cost": "₹0", "tip": "Healthy & free"},
                            {"mode": "Auto Rickshaw", "emoji": "🛺", "duration": f"{gm_dur} min", "cost": f"₹{auto_cost}–{auto_cost + 20}", "tip": "Negotiate before boarding"},
                            {"mode": "Cab / Ola", "emoji": "🚗", "duration": f"{gm_dur} min", "cost": f"₹{cab_cost}–{cab_cost + 40}", "tip": "Book via Ola/Rapido app"},
                        ],
                    }
        except Exception:
            pass

    distance_str = f"{round(dist_km * 1000)} m" if dist_km < 1 else f"{dist_km:.1f} km"
    return {
        "distance": distance_str,
        "source": source,
        "options": [
            {"mode": "Walking", "emoji": "🚶", "duration": f"{walk_minutes} min", "cost": "₹0", "tip": "Far — consider auto" if dist_km > 2.5 else "Easy walk"},
            {"mode": "Auto Rickshaw", "emoji": "🛺", "duration": f"{drive_minutes} min", "cost": f"₹{auto_cost}–{auto_cost + 20}", "tip": "Negotiate before boarding"},
            {"mode": "Cab / Ola", "emoji": "🚗", "duration": f"{drive_minutes} min", "cost": f"₹{cab_cost}–{cab_cost + 40}", "tip": "Book via Ola/Rapido app"},
        ],
    }
