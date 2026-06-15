# ─── Transport Engine (OSRM + Google Distance Matrix) ──────────────────────────
import os
import math
import httpx
from typing import Dict, Any, Optional

GOOGLE_KEY = os.getenv("GOOGLE_DISTANCE_MATRIX_KEY", "")


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance in km between two points."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _get_osrm(from_lat: float, from_lng: float, to_lat: float, to_lng: float, mode: str = "car") -> Optional[Dict]:
    """Fetch distance/duration from OSRM (free)."""
    try:
        profile = "foot" if mode == "foot" else "car"
        url = f"https://router.project-osrm.org/route/v1/{profile}/{from_lng},{from_lat};{to_lng},{to_lat}?overview=false"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            data = resp.json()
            if data.get("code") != "Ok":
                return None
            return {
                "distanceM": data["routes"][0]["distance"],
                "durationS": data["routes"][0]["duration"],
            }
    except Exception:
        return None


async def get_transport(from_lat: float, from_lng: float, to_lat: float, to_lng: float) -> Dict[str, Any]:
    """Get walking, auto, and cab estimates between two points."""
    walk_data, drive_data = await _get_osrm(from_lat, from_lng, to_lat, to_lng, "foot"), None
    drive_data = await _get_osrm(from_lat, from_lng, to_lat, to_lng, "car")

    dist_km = (drive_data["distanceM"] / 1000) if drive_data else _haversine(from_lat, from_lng, to_lat, to_lng)
    drive_minutes = math.ceil(drive_data["durationS"] / 60) if drive_data else math.ceil(dist_km * 3)
    walk_minutes = math.ceil(walk_data["durationS"] / 60) if walk_data else math.ceil(dist_km * 12)

    auto_cost = max(30, round(dist_km * 12))
    cab_cost = max(60, round(dist_km * 18))

    # ── Try Google Distance Matrix if key is present ──
    if GOOGLE_KEY and GOOGLE_KEY != "your_google_distance_matrix_key_here":
        try:
            gm_url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={from_lat},{from_lng}&destinations={to_lat},{to_lng}&mode=driving&key={GOOGLE_KEY}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(gm_url)
                gm_data = resp.json()
                gm_row = gm_data.get("rows", [{}])[0].get("elements", [{}])[0]
                if gm_row.get("status") == "OK":
                    gm_dur = math.ceil(gm_row["duration"]["value"] / 60)
                    return {
                        "distance": gm_row["distance"]["text"],
                        "options": [
                            {"mode": "Walking", "emoji": "🚶", "duration": f"{walk_minutes} min", "cost": "₹0", "tip": "Healthy & free"},
                            {"mode": "Auto Rickshaw", "emoji": "🛺", "duration": f"{gm_dur} min", "cost": f"₹{auto_cost}–{auto_cost + 20}", "tip": "Negotiate before boarding"},
                            {"mode": "Cab / Ola", "emoji": "🚗", "duration": f"{gm_dur} min", "cost": f"₹{cab_cost}–{cab_cost + 40}", "tip": "Book via Ola/Rapido app"},
                        ],
                    }
        except Exception:
            pass

    # ── OSRM-based response ──
    distance_str = f"{round(dist_km * 1000)} m" if dist_km < 1 else f"{dist_km:.1f} km"
    return {
        "distance": distance_str,
        "options": [
            {"mode": "Walking", "emoji": "🚶", "duration": f"{walk_minutes} min", "cost": "₹0", "tip": "Far — consider auto" if dist_km > 2.5 else "Easy walk"},
            {"mode": "Auto Rickshaw", "emoji": "🛺", "duration": f"{drive_minutes} min", "cost": f"₹{auto_cost}–{auto_cost + 20}", "tip": "Negotiate before boarding"},
            {"mode": "Cab / Ola", "emoji": "🚗", "duration": f"{drive_minutes} min", "cost": f"₹{cab_cost}–{cab_cost + 40}", "tip": "Book via Ola/Rapido app"},
        ],
    }
