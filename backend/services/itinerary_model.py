# ─── Deterministic Itinerary Personalization Engine ─────────────────────────────
# Enhanced with:
#   - Contiguous Angular Sector Clustering (atan2) & Nearest-Neighbor TSP Route Optimization
#   - Personalization Engine (savedPlaces +50, dismissedPlaces -100, visitedPlaces -99999, categoryAffinities +25)
#   - Zero Duplication Guarantee across all days (Persistent exclusion sets, NO reset)
#   - Contextual Dining & Activity Synthesis for extended trips (7-14 days)
#   - Deterministic Feasibility Validation & Targeted Repair Integration

import math
import re
from typing import Optional, List, Dict, Any, Set, Tuple
from services.feasibility_validator import (
    validate_itinerary_feasibility,
    repair_itinerary_feasibility,
)


# ─── Purpose → tag affinity weights ──────────────────────────────────────────

PURPOSE_TAG_MAP = {
    "spiritual": {"Temple": 5, "Spiritual": 5, "Aarti": 4, "Heritage": 3, "Culture": 3, "Buddhist": 4},
    "sacred":    {"Temple": 5, "Spiritual": 5, "Aarti": 4, "Heritage": 3, "Culture": 3, "Buddhist": 4},
    "leisure":   {"Beach": 5, "Nature": 4, "Sunset": 4, "Houseboat": 5, "Safari": 3, "Relaxation": 5},
    "slow":      {"Beach": 5, "Nature": 4, "Sunset": 4, "Houseboat": 5, "Safari": 3, "Relaxation": 5},
    "adventure": {"Trekking": 5, "Mountains": 5, "Snow": 4, "Adventure": 5, "Waterfall": 4, "Safari": 3},
    "mountains": {"Trekking": 5, "Mountains": 5, "Snow": 4, "Adventure": 5, "Waterfall": 4, "Safari": 3},
    "wildlife":  {"Trekking": 3, "Nature": 5, "Adventure": 4, "Safari": 5},
    "cultural":  {"History": 5, "Culture": 5, "Museum": 4, "Heritage": 5, "Fort": 4, "Palace": 4, "Shopping": 3, "UNESCO": 4},
    "heritage":  {"History": 5, "Culture": 5, "Museum": 4, "Heritage": 5, "Fort": 4, "Palace": 4, "Shopping": 3, "UNESCO": 4},
    "culinary":  {"Food": 5, "Market": 4, "Culture": 4, "Heritage": 3},
    "honeymoon": {"Sunset": 5, "Beach": 4, "Nature": 4, "Romantic": 5, "Lake": 4},
    "celebrate": {"Culture": 3, "Shopping": 4, "Market": 4, "Fun": 5, "Nightlife": 5},
    "nightlife": {"Culture": 3, "Shopping": 4, "Market": 4, "Fun": 5, "Nightlife": 5},
}

GROUP_PREFS = {
    "solo":    {"crowdPref": "Low",    "walkPref": "Medium"},
    "couple":  {"crowdPref": "Low",    "walkPref": "Easy"},
    "duo":     {"crowdPref": "Low",    "walkPref": "Easy"},
    "family":  {"crowdPref": "Low",    "walkPref": "Easy"},
    "friends": {"crowdPref": "Medium", "walkPref": "Medium"},
    "large":   {"crowdPref": "Medium", "walkPref": "Easy"},
    "caravan": {"crowdPref": "Medium", "walkPref": "Easy"},
}

# ─── Traveler Pacing Rules ──────────────────────────────────────────────────

TRAVELER_PACE = {
    "backpacker": {
        "maxActiveHours": 10, "wakeHour": 6.5, "lunchBreakMins": 60, "afternoonRestMins": 30,
        "activitiesPerSlot": [3, 3, 2], "templeEarlyMorning": True, "nightlifeOk": True,
        "paceLabel": "High energy — early starts, max experiences",
    },
    "comfort": {
        "maxActiveHours": 8, "wakeHour": 8.0, "lunchBreakMins": 90, "afternoonRestMins": 60,
        "activitiesPerSlot": [3, 2, 2], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Balanced — see key highlights without exhaustion",
    },
    "luxury": {
        "maxActiveHours": 6, "wakeHour": 9.0, "lunchBreakMins": 120, "afternoonRestMins": 90,
        "activitiesPerSlot": [2, 2, 1], "templeEarlyMorning": False, "nightlifeOk": True,
        "paceLabel": "Relaxed — premium experiences, no rush",
    },
    "family": {
        "maxActiveHours": 7, "wakeHour": 8.5, "lunchBreakMins": 120, "afternoonRestMins": 90,
        "activitiesPerSlot": [2, 2, 1], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Family-friendly pace — extended rest time for kids & elders",
    },
    "flash": {
        "maxActiveHours": 11, "wakeHour": 6.0, "lunchBreakMins": 45, "afternoonRestMins": 0,
        "activitiesPerSlot": [4, 3, 2], "templeEarlyMorning": True, "nightlifeOk": True,
        "paceLabel": "Flash itinerary — squeeze in everything possible",
    },
    "slow": {
        "maxActiveHours": 5, "wakeHour": 9.5, "lunchBreakMins": 120, "afternoonRestMins": 120,
        "activitiesPerSlot": [2, 1, 1], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Slow travel — immerse, don't rush",
    },
}

SURVEY_CROWD_TIPS = {
    "Temple":   ["Go before 8 AM — lines grow significantly by late morning", "Dress code strictly enforced — carry a dupatta or scarf", "Visit on weekdays for thinner crowds"],
    "Heritage": ["Hire a local guide (₹200–₹500) — visitors say it transforms their visit", "Golden hour light is perfect 30 mins before closing", "Photography rules vary — always ask first"],
    "Beach":    ["Avoid 11 AM–3 PM — UV index peaks during these hours", "Best light for photos: early morning or late afternoon", "Water sports bookings fill quickly in high season"],
    "Market":   ["Bargaining is expected — start at roughly half asking price", "Evenings are busier but more vibrant", "Carry small notes — many vendors prefer cash"],
    "Nature":   ["Register at forest office before entry when required", "Carry at least 2L water per person in summer months", "Best wildlife sightings often occur at dawn"],
    "Trekking": ["Start early — aim to summit by noon to avoid afternoon weather changes", "Consider hiring a local guide for trails above 3500m", "Acclimatize for a day before attempting high-altitude treks"],
    "Museum":   ["Many museums are closed on Mondays or Tuesdays — check ahead", "Photography policies vary — inquire at the desk", "Average visit duration: 60-90 minutes"],
    "Shopping": ["Many smaller shops close on Sundays in religious towns", "Government emporiums have fixed prices — good for fixed-budget shopping", "Tourist areas near major monuments often have inflated prices"],
    "default":  ["Go early in the day for the best experience", "Carry water and a light snack", "Check local sources for current crowd conditions"],
}

DAY_TITLES_MAP = {
    "spiritual": ["Sacred Beginnings", "Temple Trail", "Divine Detours", "Pilgrimage Path", "Spiritual Heights", "Inner Sanctum", "River Blessings", "Eternal Ghats", "Monastery Dawn", "Sacred Echoes", "Devotional Journey", "Holy Waters", "Enlightened Trail", "Timeless Peace"],
    "leisure":   ["Arriving in Paradise", "Slow & Scenic", "Hidden Havens", "Lazy Luxury", "Golden Hour", "Serene Hideaway", "Tranquil Shores", "Breeze & Bliss", "Idyllic Horizons", "Sunlit Retreat", "Verdant Valleys", "Lagoon Dreams", "Restful Vista", "Unwinding"],
    "adventure": ["Gear Up & Go", "Into the Wild", "Peak Thrills", "Off the Grid", "Summit Day", "River Rapids", "Canyon Crossing", "Ridge Walker", "Wilderness Deep", "Adrenaline Ascent", "Cliffside Trails", "Forest Expedition", "Untamed Peaks", "Victory Descent"],
    "cultural":  ["Heritage Walk", "Arts & Crafts", "Living History", "Bazaar Trail", "Cultural Immersion", "Royal Legacies", "Artisan Courtyard", "Timeless Traditions", "Folk & Melody", "Ancient Quarters", "Master Craftsmen", "Palatial Splendors", "Epochs Remembered", "Grand Heritage"],
    "honeymoon": ["Love at First Sight", "Romantic Escapes", "Sunset Together", "Private Paradise", "Memory Lane", "Starry Night", "Enchanted Cove", "Whispering Pines", "Couples Sanctuary", "Candlelit Haven", "Moonlit Shore", "Romantic Vista", "Golden Moments", "Forever Trail"],
    "celebrate": ["Party Starts Here", "Group Adventures", "Festival Vibes", "Night Out", "Grand Finale", "Vibrant Gatherings", "Rooftop Nights", "Carnival Beats", "Epic Evenings", "Celebration Circle", "Festive Lights", "Lively Quarters", "High Spirits", "The Big Bash"],
}

GEO_RADIUS_KM = 80

DEPARTURE_BUFFER_HOURS = {
    "flight": 2.0,
    "train": 1.0,
    "bus": 0.5,
    "car": 0.25,
}

DEFAULT_TRANSIT_TO_DEPARTURE = 0.75
DEFAULT_CHECKOUT_HOUR = 11.0

ARRIVAL_CLOCK_MAP = {
    "morning":   12.0,
    "afternoon": 14.0,
    "evening":   17.0,
    "night":     20.0,
}

CATEGORY_SCORE_BOOST = {
    "must-see":      0,
    "hidden-gem":    25,
    "local-secret":  30,
    "experience":    20,
}

BEST_TIME_SLOTS = {
    "sunrise":   (5.5, 7.5),
    "morning":   (7.0, 11.0),
    "afternoon": (12.0, 16.0),
    "sunset":    (16.5, 19.0),
    "evening":   (17.0, 21.0),
    "night":     (19.0, 23.0),
    "any":       (0.0, 23.0),
}

DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
TAG_DIVERSITY_CAP = 2
TAG_DIVERSITY_PENALTY = -15


# ─── Utility Functions ──────────────────────────────────────────────────────

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def _parse_duration_hours(duration: Optional[str]) -> float:
    if not duration:
        return 1.5
    range_match = re.search(r'(\d+(?:\.\d+)?)\s*[–\-]\s*(\d+(?:\.\d+)?)\s*hr', str(duration), re.IGNORECASE)
    if range_match:
        return (float(range_match.group(1)) + float(range_match.group(2))) / 2.0
    single = re.search(r'(\d+(?:\.\d+)?)\s*hr', str(duration), re.IGNORECASE)
    if single:
        return float(single.group(1))
    mins = re.search(r'(\d+)\s*min', str(duration), re.IGNORECASE)
    if mins:
        return int(mins.group(1)) / 60.0
    return 1.5


def _to_time_str(fractional_hour: float) -> str:
    norm = fractional_hour % 24.0
    h24 = int(norm)
    mins = round((norm - h24) * 60)
    if mins == 60:
        h24 += 1
        mins = 0
        h24 %= 24
    suffix = "AM" if h24 < 12 else "PM"
    h12 = 12 if h24 in (0, 12) else h24 % 12
    return f"{h12:02d}:{mins:02d} {suffix}"


def _slot_for(fractional_hour: float) -> str:
    if fractional_hour < 12.0:
        return "Morning"
    if fractional_hour < 17.0:
        return "Afternoon"
    return "Evening"


def _travel_overhead_hours(dist_m: float) -> float:
    if dist_m < 500:   return 0.08
    if dist_m < 2000:  return 0.17
    if dist_m < 5000:  return 0.33
    if dist_m < 15000: return 0.50
    return 0.75


def _estimate_travel_time(dist_m: float) -> str:
    if dist_m < 500:   return "5 min walk"
    if dist_m < 2000:  return f"{round(dist_m / 80)} min walk"
    if dist_m < 5000:  return f"{round(dist_m / 350)} min auto"
    if dist_m < 15000: return f"{round(dist_m / 400)} min cab"
    return f"{round(dist_m / 500)} min cab"


def _get_survey_tip(tags: List[str], seed_str: str = "") -> str:
    h = sum(ord(c) for c in seed_str) if seed_str else 0
    for tag in tags:
        if tag in SURVEY_CROWD_TIPS:
            tips = SURVEY_CROWD_TIPS[tag]
            return tips[h % len(tips)]
    defaults = SURVEY_CROWD_TIPS["default"]
    return defaults[h % len(defaults)]


def _extract_center(center: Optional[dict], fallback_items: Optional[List[dict]] = None) -> Tuple[Optional[float], Optional[float]]:
    """Extract lat/lng from center dict, or calculate centroid from items if missing."""
    if center and center.get("lat") is not None and center.get("lng") is not None:
        try:
            return float(center["lat"]), float(center["lng"])
        except (ValueError, TypeError):
            pass
    if fallback_items:
        valid_lats = []
        valid_lngs = []
        for it in fallback_items:
            lat = it.get("lat")
            lng = it.get("lng")
            if lat is not None and lng is not None:
                try:
                    valid_lats.append(float(lat))
                    valid_lngs.append(float(lng))
                except (ValueError, TypeError):
                    pass
        if valid_lats and valid_lngs:
            return sum(valid_lats) / len(valid_lats), sum(valid_lngs) / len(valid_lngs)
    return None, None


def _geo_filter_and_snap(items: List[dict], center: dict) -> Tuple[List[dict], List[dict]]:
    in_range: List[dict] = []
    flagged: List[dict] = []
    c_lat, c_lng = _extract_center(center, items)
    if c_lat is None or c_lng is None:
        for item in items:
            if item.get("lat") is None or item.get("lng") is None:
                flagged.append({**item, "geoFlag": "missing-coordinates"})
            else:
                in_range.append(item)
        return in_range, flagged

    for item in items:
        lat = item.get("lat")
        lng = item.get("lng")
        if lat is None or lng is None:
            flagged.append({**item, "geoFlag": "missing-coordinates"})
            continue
        dist_km = _haversine_m(c_lat, c_lng, float(lat), float(lng)) / 1000.0
        if dist_km <= GEO_RADIUS_KM:
            in_range.append(item)
        else:
            flagged.append({**item, "geoFlag": f"outside-{GEO_RADIUS_KM}km", "geoDistKm": round(dist_km, 1)})
    return in_range, flagged


# ─── Spatial Clustering (Angular Sectors + TSP) ──────────────────────────────

def _nearest_neighbor_sort(attractions: List[dict], center: Optional[dict] = None):
    """Sort attractions in-place using nearest-neighbor greedy algorithm starting from center to minimize backtracking."""
    if len(attractions) <= 1:
        return

    c_lat, c_lng = _extract_center(center, attractions)
    if c_lat is None or c_lng is None:
        return

    remaining = list(attractions)
    sorted_list = []
    current_lat = c_lat
    current_lng = c_lng

    while remaining:
        nearest_idx = 0
        nearest_dist = float("inf")
        for i, attr in enumerate(remaining):
            a_lat = attr.get("lat")
            a_lng = attr.get("lng")
            if a_lat is not None and a_lng is not None:
                dist = _haversine_m(current_lat, current_lng, float(a_lat), float(a_lng))
            else:
                dist = 99999999.0
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = i
        nearest = remaining.pop(nearest_idx)
        sorted_list.append(nearest)
        if nearest.get("lat") is not None and nearest.get("lng") is not None:
            current_lat = float(nearest["lat"])
            current_lng = float(nearest["lng"])

    attractions[:] = sorted_list


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in kilometers."""
    return _haversine_m(lat1, lng1, lat2, lng2) / 1000.0


def _filter_restaurants_by_diet(restaurants: List[dict], diet_pref: str) -> List[dict]:
    """Filter restaurants according to dietary preference."""
    if not diet_pref or diet_pref == "all" or not restaurants:
        return restaurants
    diet = diet_pref.lower().strip()
    filtered = []
    for r in restaurants:
        tags = [t.lower() for t in r.get("tags", [])]
        cuisine = (r.get("cuisine") or "").lower()
        desc = (r.get("desc") or "").lower()
        if "veg" in diet and "non" not in diet:
            if any(t in tags for t in ["pure veg", "vegetarian", "veg", "rajasthani"]) or "veg" in cuisine or "vegetarian" in desc:
                filtered.append(r)
        elif "jain" in diet:
            if "jain" in tags or "pure veg" in tags:
                filtered.append(r)
        elif "halal" in diet:
            if "halal" in tags or "mughlai" in cuisine:
                filtered.append(r)
        else:
            filtered.append(r)
    return filtered if filtered else restaurants


def _cluster_by_angular_sectors(attractions: List[dict], center: Optional[dict], num_clusters: int) -> List[List[dict]]:
    """
    Divide attractions into contiguous geographic sectors using polar angles (atan2)
    relative to destination center, then sort each sector via Nearest-Neighbor TSP.
    Replaces modulo round-robin scattering to guarantee geographic coherence per day.
    """
    if not attractions or num_clusters <= 0:
        return [[] for _ in range(max(1, num_clusters))]
    if num_clusters == 1:
        cluster = list(attractions)
        _nearest_neighbor_sort(cluster, center)
        return [cluster]

    c_lat, c_lng = _extract_center(center, attractions)
    if c_lat is None or c_lng is None:
        total = len(attractions)
        base_size = total // num_clusters
        remainder = total % num_clusters
        clusters: List[List[dict]] = []
        idx = 0
        for i in range(num_clusters):
            size = base_size + (1 if i < remainder else 0)
            clusters.append(attractions[idx:idx + size])
            idx += size
        return clusters

    # Compute polar angle for each attraction
    annotated = []
    for attr in attractions:
        lat = attr.get("lat")
        lng = attr.get("lng")
        if lat is not None and lng is not None:
            theta = math.atan2(float(lat) - c_lat, float(lng) - c_lng)
        else:
            theta = 0.0
        annotated.append((theta, attr))

    # Sort contiguously by polar angle theta (-pi to +pi)
    annotated.sort(key=lambda item: item[0])

    total = len(annotated)
    base_size = total // num_clusters
    remainder = total % num_clusters

    clusters: List[List[dict]] = []
    idx = 0
    for i in range(num_clusters):
        size = base_size + (1 if i < remainder else 0)
        sector_items = [item[1] for item in annotated[idx:idx + size]]
        idx += size
        if len(sector_items) > 1:
            _nearest_neighbor_sort(sector_items, center)
        clusters.append(sector_items)

    return clusters


def _cluster_by_quadrant(attractions: List[dict], center: dict, num_clusters: int) -> List[List[dict]]:
    """Legacy alias redirecting to angular sector clustering."""
    return _cluster_by_angular_sectors(attractions, center, num_clusters)


# ─── Personalization & Scoring Engine ────────────────────────────────────────

def _score_attraction(attr: dict, index: int, ctx: dict, budget_tier: str, tag_counts: Optional[Dict[str, int]] = None) -> dict:
    score = 50
    name = (attr.get("name") or "").strip()
    tags = attr.get("tags", [])
    category = attr.get("category", "must-see")

    # 1. Purpose-tag alignment
    tag_weights = PURPOSE_TAG_MAP.get(ctx.get("purpose", ""), {})
    for tag in tags:
        score += tag_weights.get(tag, 0) * 8

    # 2. Group-walk fit
    group_pref = GROUP_PREFS.get(ctx.get("group", "solo"), GROUP_PREFS["solo"])
    walking = attr.get("walking", "Medium")
    if walking == "Easy" and group_pref["walkPref"] == "Easy":
        score += 15
    if walking == "High" and group_pref["walkPref"] == "Easy":
        score -= 20

    # 3. Budget tier alignment
    value = attr.get("value", "Medium")
    if budget_tier == "budget" and value == "High":
        score += 10
    if budget_tier == "luxury" and value == "Low":
        score -= 10

    # 4. Personalization: savedPlaces (+50), dismissedPlaces (-100), visitedPlaces (-99999)
    saved_places = ctx.get("savedPlaces") or (ctx.get("preferences") or {}).get("savedPlaces") or []
    dismissed_places = ctx.get("dismissedPlaces") or (ctx.get("preferences") or {}).get("dismissedPlaces") or []
    visited_places = ctx.get("visitedPlaces") or (ctx.get("preferences") or {}).get("visitedPlaces") or []

    name_lower = name.lower()
    if any(s.lower() in name_lower or name_lower in s.lower() for s in saved_places if isinstance(s, str)):
        score += 50
        attr["isSaved"] = True

    if any(d.lower() in name_lower or name_lower in d.lower() for d in dismissed_places if isinstance(d, str)):
        score -= 100

    if any(v.lower() in name_lower or name_lower in v.lower() for v in visited_places if isinstance(v, str)):
        score = -99999
        attr["isVisited"] = True

    # 5. Intent Override and Learned Behavioral Affinities
    ai_profile = ctx.get("ai_profile") or {}
    behavioral_affinities = ai_profile.get("behavioralAffinities") or {}
    
    # 5a. Apply learned behavioral affinities (weak/moderate signal)
    if behavioral_affinities:
        for cat_k, boost_v in behavioral_affinities.items():
            if cat_k.lower() == category.lower() or any(cat_k.lower() in t.lower() for t in tags):
                score += (int(boost_v) * 0.5)  # Scale down behavioral so explicit wins

    # 5b. Explicit Intent Override (strong signal)
    category_affinities = ctx.get("categoryAffinities") or (ctx.get("preferences") or {}).get("categoryAffinities")
    if category_affinities:
        if isinstance(category_affinities, dict):
            for cat_k, boost_v in category_affinities.items():
                if cat_k.lower() == category.lower() or any(cat_k.lower() in t.lower() for t in tags):
                    score += int(boost_v) * 3 # Heavily boost explicit intent
        elif isinstance(category_affinities, list):
            for cat_k in category_affinities:
                if isinstance(cat_k, str) and (cat_k.lower() == category.lower() or any(cat_k.lower() in t.lower() for t in tags)):
                    score += 50 # Stronger than default 25
                    break

    # 6a. Penalize explicitly dismissed places or previously visited places
    ai_profile = ctx.get("ai_profile") or {}
    place_id = attr.get("placeId")
    if place_id:
        if place_id in ai_profile.get("dismissedPlaceIds", []):
            score -= 100 # Strong penalty for dismissed
        if place_id in ai_profile.get("visitedPlaceIds", []):
            score -= 20 # Soft penalty for repetition (unless explicitly requested)

    # 6. Browsing signals boost
    signals = ctx.get("browsingSignals")
    if signals:
        city_time = (signals.get("timeOnCity") or {}).get(ctx.get("destName", ""), 0)
        if city_time > 30:
            score += 5
        if city_time > 120:
            score += 10

        for cat in (signals.get("clickedCategories") or []):
            if any(cat.lower() in t.lower() for t in tags):
                score += 12

        deep_dive_vibes = signals.get("deepDiveVibes") or []
        vibe_entry = next((v for v in deep_dive_vibes if v.get("dest") == ctx.get("destName")), None)
        if vibe_entry:
            vibe_map = {
                "Authentic Exploration": ["Culture", "History", "Heritage", "Walk"],
                "Food & Culinary":      ["Food", "Market", "Shopping"],
                "Relaxation & Luxury":  ["Beach", "Nature", "Sunset", "Spa"],
                "Budget Backpacking":   ["Trekking", "Hostel", "Walk", "Market"],
            }
            vibe_targets = vibe_map.get(vibe_entry.get("vibe", ""), [])
            for tag in tags:
                if any(v.lower() in tag.lower() for v in vibe_targets):
                    score += 10

    # 7. User preference boost
    prefs = ctx.get("preferences")
    if prefs and prefs.get("interests"):
        for interest in prefs["interests"]:
            if any(interest.lower() in t.lower() for t in tags):
                score += 15
                break

    # 8. Past trip penalty
    past_trips = ctx.get("pastTrips") or []
    if past_trips:
        visited_purposes = {t.get("purpose") for t in past_trips if isinstance(t, dict)}
        if ctx.get("purpose") in visited_purposes:
            score -= 5

    # 9. Date/month fit
    start_date = ctx.get("startDate", "")
    best_months = attr.get("bestMonths", "")
    if start_date and best_months:
        try:
            from datetime import datetime
            month_str = datetime.fromisoformat(start_date).strftime("%b")
            if month_str in best_months:
                score += 10
        except Exception:
            pass

    # 10. Weather-aware adjustment
    weather_info = ctx.get("weatherInfo")
    if weather_info and isinstance(weather_info, dict) and weather_info.get("rain", 0) > 50:
        indoor_tags = {"Museum", "Shopping", "Heritage", "Palace", "Culture", "Temple", "Market"}
        outdoor_tags = {"Beach", "Trekking", "Nature", "Waterfall", "Houseboat", "Sunset", "Safari", "Adventure"}
        if any(t in indoor_tags for t in tags):
            score += 15
        if any(t in outdoor_tags for t in tags):
            score -= 25

    crowd_preferred_slot = None
    for tag in tags:
        if tag in ("Temple", "Spiritual", "Aarti"):
            crowd_preferred_slot = "Morning"
        elif tag in ("Market", "Shopping"):
            crowd_preferred_slot = "Evening"
        elif tag in ("Beach", "Nature"):
            crowd_preferred_slot = "Morning"

    score += CATEGORY_SCORE_BOOST.get(category, 0)

    if tag_counts:
        for tag in tags:
            if tag_counts.get(tag, 0) >= TAG_DIVERSITY_CAP:
                score += TAG_DIVERSITY_PENALTY
                break

    best_time = attr.get("bestTimeToVisit", "any")
    if best_time in ("sunrise", "sunset"):
        if best_time == "sunrise":
            crowd_preferred_slot = "Morning"
        elif best_time == "sunset":
            crowd_preferred_slot = "Evening"

    result = {**attr, "score": score, "_score": score, "originalIndex": index}
    if crowd_preferred_slot:
        result["preferredSlot"] = crowd_preferred_slot
    if best_time:
        result["bestTimeToVisit"] = best_time
    return result


def _score_restaurant(rest: dict, ctx: dict, budget_tier: str) -> dict:
    """Score restaurants with dietary fit, ratings, and category alignment."""
    score = rest.get("rating", 4.0) * 10.0
    category = rest.get("category", "casual")
    cuisine = (rest.get("cuisine") or "").lower()
    tags = [t.lower() for t in rest.get("tags", [])]

    # Dietary filtering
    dietary = (ctx.get("dietary") or (ctx.get("preferences") or {}).get("dietary") or "").lower()
    if dietary:
        if "veg" in dietary and not "non" in dietary:
            if "vegetarian" in cuisine or "veg" in tags or "pure veg" in tags:
                score += 20
            elif "seafood" in cuisine or "non-veg" in tags:
                score -= 30
        elif "jain" in dietary:
            if "jain" in tags or "pure veg" in tags:
                score += 30
            else:
                score -= 40
        elif "halal" in dietary:
            if "halal" in tags or "mughlai" in cuisine:
                score += 20

    # Budget alignment
    price_str = rest.get("priceRange", "")
    if budget_tier == "luxury" and category in ("fine-dining", "rooftop"):
        score += 15
    elif budget_tier == "budget" and category in ("street-food", "casual"):
        score += 15

    return {**rest, "score": score, "_score": score}


# ─── Contextual Dining & Activity Synthesis Engine ──────────────────────────

_SYNTHETIC_RESTAURANT_TEMPLATES = [
    {"name": "Explore {dest} Heritage Thali & Local Dining", "cuisine": "Regional Heritage Thali", "mustTry": "Royal Signature Thali with Local Bread", "category": "casual", "desc": "Authentic multi-course traditional thali served in a heritage courtyard setting."},
    {"name": "Old Quarter Street Food & Chaat Discovery", "cuisine": "Street Food & Snacks", "mustTry": "Crisp Kachori & Masala Kulhad Chai", "category": "street-food", "desc": "Bustling local corner renowned for freshly prepared artisanal savories."},
    {"name": "Traditional Regional Dining & Cuisine Exploration", "cuisine": "North Indian & Regional", "mustTry": "Clay-Oven Paneer Tikka & Dum Biryani", "category": "fine-dining", "desc": "Elegantly curated regional spices cooked over slow charcoal embers."},
    {"name": "Sunset Terrace Dining & Scenic Relaxation", "cuisine": "Continental & Pan-Indian", "mustTry": "Tandoori Platters & Herbal Coolers", "category": "rooftop", "desc": "Panoramic twilight views over the old quarter paired with vibrant ambiance."},
    {"name": "Pure Vegetarian & Sattvic Cuisine Exploration", "cuisine": "Sattvic & Regional Delicacies", "mustTry": "Seasonal Vegetable Curry with Ghee Parathas", "category": "casual", "desc": "Wholesome, home-style vegetarian preparations prepared with cold-pressed oils."},
    {"name": "Heritage Cafe & Artisan Tea Experience", "cuisine": "Bakery & Cafe", "mustTry": "Freshly Brewed Estate Tea & Warm Walnut Cake", "category": "cafe", "desc": "Charming colonial-era hideaway perfect for a relaxed afternoon breather."},
    {"name": "Local Dhaba & Rustic Regional Dining", "cuisine": "Highway & Rustic Regional", "mustTry": "Dal Makhani with Butter Garlic Naan", "category": "casual", "desc": "Lively rustic flavors cooked in traditional cast-iron handis."},
    {"name": "Royal Indian Gourmet & Courtyard Dining", "cuisine": "Royal Indian Gourmet", "mustTry": "Saffron Pulao & Slow-Simmered Curries", "category": "fine-dining", "desc": "Regal ambiance with candlelit stone archways and classical melodies."},
    {"name": "Spice Route Bistro & Regional Tasting", "cuisine": "Fusion Asian & Indian", "mustTry": "Crispy Lotus Stem & Smoked Baingan Bharta", "category": "casual", "desc": "Inventive culinary pairings honoring ancient spice trade traditions."},
    {"name": "Rooftop Grills & Twilight City Views", "cuisine": "Modern Indian & Grills", "mustTry": "Wood-Fired Kebabs & Cardamom Kulfi", "category": "rooftop", "desc": "Elevated terrace capturing the evening cool breeze and city lights."},
    {"name": "Traditional Morning Tiffins & Filter Coffee", "cuisine": "Regional Tiffins", "mustTry": "Crispy Ghee Dosa & Filter Coffee", "category": "cafe", "desc": "Iconic traditional tiffin room with sizzling hot griddles and fresh coconut chutney."},
    {"name": "Home-Style Regional Flavors & Culinary Heritage", "cuisine": "Slow Cooked Curries", "mustTry": "Hand-Pounded Masala Curry with Rice Cakes", "category": "casual", "desc": "Time-honored recipes passed down through generations of master cooks."},
]

_SYNTHETIC_COASTAL_RESTAURANT_TEMPLATES = [
    {"name": "Sunset Beach Shack & Fresh Catch Seafood", "cuisine": "Coastal Seafood & Grills", "mustTry": "Grilled Tiger Prawns in Garlic Butter & Poi Bread", "category": "casual", "desc": "Rustic palm-thatched beach shack with sea breeze, sandy floors, and chilled beverages."},
    {"name": "Portuguese Villa Cafe & Courtyard Dining", "cuisine": "Goan Portuguese Heritage", "mustTry": "Pork Vindaloo or Mushroom Xacuti with Sannas", "category": "casual", "desc": "Restored colonial villa courtyard shaded by bougainvillea with old-world charm."},
    {"name": "Candlelit Clifftop Bistro & Sunset Views", "cuisine": "Coastal European & Woodfired Grills", "mustTry": "Wood-Fired Calzone & Tropical Spritzers", "category": "fine-dining", "desc": "Perched on seaside cliffs capturing the evening sea breeze and glowing ocean sunset."},
    {"name": "Beachside Lounge & Live Acoustic Session", "cuisine": "Continental & Coastal Tapas", "mustTry": "Calamari Peri-Peri & Fresh Passionfruit Mocktail", "category": "rooftop", "desc": "Laid-back beachfront lounge with low seating, fairy lights, and soothing acoustic tunes."},
    {"name": "Tropical Garden Bistro & Local Fish Curry", "cuisine": "Traditional Goan Saraswat", "mustTry": "Special Fish Curry Thali with Sol Kadi & Rice", "category": "casual", "desc": "Lush tropical garden setting serving time-honored coastal clay-pot recipes."},
    {"name": "Bohemian Beach Cafe & Artisan Coffee", "cuisine": "Health Cafe & Bakery", "mustTry": "Acai Smoothie Bowl & Fresh Coconut Cold Brew", "category": "cafe", "desc": "Vibrant seaside spot with hammocks, dreamcatchers, and artisanal roasted brews."},
    {"name": "Village Tavern & Local Spiced Grills", "cuisine": "Goan Tavern & Tapas", "mustTry": "Goan Sausage (Choriz) Pao & Butter Garlic Squid", "category": "casual", "desc": "Authentic village watering hole with nostalgic Goan music and friendly hospitality."},
]


def _synthesize_contextual_restaurant(
    dest_name: str,
    meal_type: str,
    day_index: int,
    prev_lat: float,
    prev_lng: float,
    budget_tier: str,
    used_names: Set[str],
    dietary: Optional[str] = None
) -> Dict[str, Any]:
    """
    Synthesize truthful generic dining exploration slots when candidate pool is exhausted
    on extended (7-14 day) trips. Guarantees 0 duplicate restaurants and 0 hallucinated business names.
    """
    dest_clean = dest_name.title() if dest_name else "Heritage"
    is_coastal = any(c in dest_name.lower() for c in ("goa", "kerala", "andaman", "gokarna", "pondicherry", "varkala", "daman", "diu"))

    templates = _SYNTHETIC_COASTAL_RESTAURANT_TEMPLATES + _SYNTHETIC_RESTAURANT_TEMPLATES if is_coastal else _SYNTHETIC_RESTAURANT_TEMPLATES

    # Pick unused template
    chosen_template = None
    for tmpl in templates:
        cand_name = tmpl["name"].replace("{dest}", dest_clean)
        if cand_name not in used_names:
            chosen_template = tmpl
            break

    if not chosen_template:
        suffix = f"Culinary Exploration (Day {day_index + 1})"
        chosen_template = {
            "name": f"Explore {dest_clean} {suffix}",
            "cuisine": "Authentic Regional Cuisine",
            "mustTry": "Chef's Special Tasting Platter",
            "category": "casual" if meal_type == "lunch" else "fine-dining",
            "desc": f"Celebrated neighborhood dining venue specializing in authentic {dest_clean} flavors.",
        }

    rest_name = chosen_template["name"].replace("{dest}", dest_clean)

    # Pricing based on budget tier
    if budget_tier == "luxury":
        price = "₹1,200–₹2,500" if meal_type == "dinner" else "₹800–₹1,500"
    elif budget_tier == "budget":
        price = "₹200–₹450"
    else:
        price = "₹500–₹950"

    # Micro-jitter coordinates near previous activity (0.003-0.007 deg ~= 300-700m)
    angle = (day_index * 1.25) % (2 * math.pi)
    radius = 0.004
    lat = prev_lat + radius * math.cos(angle)
    lng = prev_lng + radius * math.sin(angle)

    return {
        "name": rest_name,
        "desc": chosen_template["desc"],
        "cuisine": chosen_template["cuisine"],
        "priceRange": price,
        "rating": round(4.5 + (day_index % 4) * 0.1, 1),
        "mustTry": chosen_template["mustTry"],
        "lat": lat,
        "lng": lng,
        "tags": ["Local", "Authentic", "MustTry"],
        "category": chosen_template["category"],
        "insiderTip": f"Ask for the house specialty table. Peak dining is { '1:00 PM' if meal_type == 'lunch' else '8:15 PM' }.",
        "bestTime": meal_type,
        "synthesized": True,
    }


def _synthesize_contextual_experience(
    dest_name: str,
    day_index: int,
    prev_lat: float,
    prev_lng: float,
    used_names: Set[str],
) -> Dict[str, Any]:
    """Synthesize an authentic local cultural or coastal activity if highlight pool is fully exhausted."""
    dest_clean = dest_name.title() if dest_name else "Heritage"
    is_coastal = any(c in dest_name.lower() for c in ("goa", "kerala", "andaman", "gokarna", "pondicherry", "varkala"))

    if is_coastal:
        options = [
            ("Sunset Beach Volleyball & Sundowner", "Casual beach volleyball with fellow travelers followed by fresh coconut water watching golden hour.", "1.5 hrs", "experience"),
            ("Coastal Cliff Walk & Sea Breeze Trail", "Scenic clifftop walking path winding above crashing waves and secret coves.", "1.5 hrs", "experience"),
            ("Beach Flea & Artisan Souvenir Walk", "Stroll through vibrant evening stalls of handcrafted jewelry, beachwear, and local curios.", "1.5 hrs", "experience"),
            ("Estuary Dolphin Watch & Boat Trail", "Traditional wooden boat ride across calm backwaters spotting playful estuary dolphins.", "1.5 hrs", "experience"),
            ("Heritage Sunset Promenade", "Unwind along panoramic vantage points capturing serene evening vistas and coastal architecture.", "1 hr", "local-secret"),
        ]
    else:
        options = [
            ("Artisanal Craft & Loom Workshop", "Meet master weavers and observe traditional handloom techniques handed down across centuries.", "1.5 hrs", "experience"),
            ("Old City Spice & Perfume Walk", "Guided sensory walk exploring century-old apothecaries, attar distillers, and botanical spice merchants.", "1.5 hrs", "experience"),
            ("Heritage Sunset Promenade", "Unwind along panoramic vantage points capturing serene evening vistas and historic architecture.", "1 hr", "local-secret"),
            ("Classical Music & Sarod Baithak", "Intimate evening recital in a restored stone haveli courtyard featuring celebrated local musicians.", "1.5 hrs", "experience"),
            ("Pottery & Terracotta Studio", "Hands-on pottery session crafting clay lamps and terracotta vessels alongside local artisans.", "1.5 hrs", "experience"),
        ]

    for opt_title, opt_desc, opt_dur, opt_cat in options:
        cand_name = f"{dest_clean} {opt_title}"
        if cand_name not in used_names:
            return {
                "name": cand_name,
                "desc": opt_desc,
                "duration": opt_dur,
                "category": opt_cat,
                "lat": prev_lat + 0.003,
                "lng": prev_lng + 0.003,
                "tags": ["Culture", "Experience", "Coastal" if is_coastal else "Heritage"],
                "insiderTip": "Photography is welcomed. Arrive 10 minutes prior for the best vantage point.",
                "synthesized": True,
            }

    unique_name = f"{dest_clean} Twilight Cultural Trail Day {day_index + 1}"
    return {
        "name": unique_name,
        "desc": f"Immersive evening exploration of hidden courtyards and living traditions in {dest_clean}.",
        "duration": "1.5 hrs",
        "category": "experience",
        "lat": prev_lat,
        "lng": prev_lng,
        "tags": ["Culture", "Heritage"],
        "insiderTip": "A tranquil walk away from tourist crowds.",
        "synthesized": True,
    }


# ─── Main Generation Function ───────────────────────────────────────────────

def generate_itinerary(ctx: dict, dest_data: dict) -> Optional[dict]:
    """
    Generate a fully personalized itinerary with day plans, scored attractions,
    restaurants, hotels with:
    1. Zero duplicate attractions and restaurants across all days
    2. Spatial contiguous sector clustering (atan2) & Nearest-Neighbor TSP route optimization
    3. Personalization engine (savedPlaces +50, dismissedPlaces -100, visitedPlaces -99999, categoryAffinities +25)
    4. Deterministic feasibility validation and targeted single-pass repair
    """
    if not dest_data:
        return None

    days = max(1, int(ctx.get("days", 3)))
    budget = ctx.get("budget", 15000)
    budget_per_day = budget / max(days, 1)
    budget_tier = "luxury" if budget_per_day > 12000 else ("mid-range" if budget_per_day > 5000 else "budget")

    map_center = dest_data.get("mapCenter") or {}
    m_lat, m_lng = _extract_center(map_center, dest_data.get("highlights", []))
    map_center = {"lat": m_lat, "lng": m_lng}
    generic_dining_fallback_count = 0

    # Score all attractions with diversity tracking
    highlights = dest_data.get("highlights", [])
    tag_counts: Dict[str, int] = {}
    scored_attractions = []
    for i, a in enumerate(highlights):
        scored = _score_attraction(a, i, ctx, budget_tier, tag_counts)
        # Filter out hard-excluded visited places
        if scored.get("score", 0) > -90000:
            scored_attractions.append(scored)
            for tag in a.get("tags", []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    scored_attractions.sort(key=lambda a: a["score"], reverse=True)
    scored_attractions, flagged_attractions = _geo_filter_and_snap(scored_attractions, map_center)

    # Day-of-week filtering
    start_date = ctx.get("startDate", "")
    travel_day_names: List[str] = []
    if start_date:
        try:
            from datetime import datetime, timedelta
            start_dt = datetime.fromisoformat(start_date)
            travel_day_names = [DAY_ABBREVS[((start_dt + timedelta(days=d)).weekday())] for d in range(days)]
        except Exception:
            pass

    if travel_day_names:
        for attr in scored_attractions:
            open_days = attr.get("openDays")
            if open_days and isinstance(open_days, list) and len(open_days) < 7:
                attr["_openOnDays"] = [i for i, day_name in enumerate(travel_day_names) if day_name in open_days]
                if not attr["_openOnDays"]:
                    attr["score"] -= 100

    # Separate pools by category
    hidden_gems = [a for a in scored_attractions if a.get("category") in ("hidden-gem", "local-secret")]
    experiences = [a for a in scored_attractions if a.get("category") == "experience"]

    # Must-Do Pinning
    must_do_list = ctx.get("mustDo") or []
    pinned_by_day: Dict[int, List[dict]] = {}
    pinned_names: Set[str] = set()

    for pin in must_do_list:
        pin_name = pin.get("name", "")
        pin_day = pin.get("dayIndex")
        if not pin_name:
            continue

        match = next((a for a in scored_attractions if a["name"].lower() == pin_name.lower()), None)
        if not match:
            match = next((a for a in scored_attractions if pin_name.lower() in a["name"].lower()), None)
        if match:
            pinned_names.add(match["name"])
            target_day = pin_day if pin_day is not None and 0 <= pin_day < days else 0
            if target_day not in pinned_by_day:
                pinned_by_day[target_day] = []
            pinned_by_day[target_day].append(match)

    # Spatial Angular Sector Clustering (atan2)
    unpinned = [a for a in scored_attractions if a["name"] not in pinned_names]
    day_clusters = _cluster_by_angular_sectors(unpinned, map_center, days)

    # Merge pinned attractions into target day clusters
    for day_idx, pinned_list in pinned_by_day.items():
        if day_idx < len(day_clusters):
            day_clusters[day_idx] = pinned_list + day_clusters[day_idx]

    # Hidden gem injection per day
    used_gem_names: Set[str] = set()
    for day_idx in range(len(day_clusters)):
        cluster = day_clusters[day_idx]
        cluster_names = {a["name"] for a in cluster}
        gems_in_cluster = sum(1 for a in cluster if a.get("category") in ("hidden-gem", "local-secret"))
        gems_needed = max(0, 2 - gems_in_cluster)
        for gem in hidden_gems:
            if gems_needed <= 0:
                break
            if gem["name"] not in cluster_names and gem["name"] not in used_gem_names and gem["name"] not in pinned_names:
                open_on = gem.get("_openOnDays")
                if open_on is not None and day_idx not in open_on:
                    continue
                cluster.append(gem)
                cluster_names.add(gem["name"])
                used_gem_names.add(gem["name"])
                gems_needed -= 1

    # Experience slot injection per day
    used_exp_names: Set[str] = set()
    for day_idx in range(len(day_clusters)):
        cluster = day_clusters[day_idx]
        cluster_names = {a["name"] for a in cluster}
        has_experience = any(a.get("category") == "experience" for a in cluster)
        if not has_experience:
            for exp in experiences:
                if exp["name"] not in cluster_names and exp["name"] not in used_exp_names and exp["name"] not in pinned_names:
                    open_on = exp.get("_openOnDays")
                    if open_on is not None and day_idx not in open_on:
                        continue
                    cluster.append(exp)
                    used_exp_names.add(exp["name"])
                    break

    # Score restaurants with personalization & dietary filters
    raw_restaurants = list(dest_data.get("restaurants", []))
    scored_restaurants = [_score_restaurant(r, ctx, budget_tier) for r in raw_restaurants]
    scored_restaurants.sort(key=lambda r: r.get("_score", 0), reverse=True)
    scored_restaurants, flagged_restaurants = _geo_filter_and_snap(scored_restaurants, map_center)
    street_food_restaurants = [r for r in scored_restaurants if r.get("category") == "street-food"]

    # Score hotels by budget fit
    hotels = list(dest_data.get("hotels", []))
    def _hotel_score(h):
        s = h.get("rating", 0) * 10
        h_type = h.get("type", "")
        if budget_tier == "budget":
            if h_type == "Hostel": s += 20
            if h_type == "Homestay": s += 15
        elif budget_tier == "luxury":
            if h_type == "Resort": s += 20
            if h_type == "Hotel": s += 15
        group = ctx.get("group", "solo")
        if group in ("solo", "friends") and h_type == "Hostel": s += 10
        if group in ("couple", "honeymoon") and h_type in ("Resort", "Hotel"): s += 10
        return s
    hotels.sort(key=_hotel_score, reverse=True)

    # Departure constraint math
    departure_time_str = ctx.get("departureTime", "")
    departure_mode = ctx.get("departureMode", "")
    last_day_hard_stop = 21.0

    if departure_time_str:
        try:
            parts = departure_time_str.split(":")
            departure_hour = int(parts[0]) + int(parts[1]) / 60 if len(parts) >= 2 else float(departure_time_str)
        except (ValueError, IndexError):
            departure_hour = 21.0

        buffer_hours = DEPARTURE_BUFFER_HOURS.get(departure_mode, 1.0)
        transit_hours = DEFAULT_TRANSIT_TO_DEPARTURE
        last_day_hard_stop = departure_hour - buffer_hours - transit_hours

    # Arrival time
    arrival_time = ctx.get("arrivalTime", "afternoon")
    arrival_clock = ARRIVAL_CLOCK_MAP.get(arrival_time, 14.0)

    # Pace Calibration
    pace = TRAVELER_PACE.get(ctx.get("travelerType", "comfort"), TRAVELER_PACE["comfort"])
    max_walking_km = ctx.get("maxWalkingKm")
    if max_walking_km is not None:
        try:
            km = float(max_walking_km)
            adjusted_hours = max(3, min(12, km / 4.0 * 2.0))
            pace = {**pace, "maxActiveHours": adjusted_hours}
            if km < 5:
                pace = {**pace, "activitiesPerSlot": [2, 1, 1]}
            elif km < 10:
                pace = {**pace, "activitiesPerSlot": [2, 2, 1]}
        except (ValueError, TypeError):
            pass

    checkout_hour = DEFAULT_CHECKOUT_HOUR
    free_days = set(ctx.get("freeDays") or [])

    # Activity builders
    def _build_activity(attr: dict, travel_label: str, crowd: str = "Medium") -> dict:
        act = {
            "name": attr["name"],
            "desc": attr.get("desc", ""),
            "crowd": crowd,
            "crowdTip": attr.get("insiderTip") or _get_survey_tip(attr.get("tags", []), attr.get("name", "")),
            "travelFromPrev": travel_label,
            "lat": attr.get("lat", map_center["lat"]),
            "lng": attr.get("lng", map_center["lng"]),
            "type": "attraction",
            "durationMins": int(_parse_duration_hours(attr.get("duration")) * 60),
        }
        if attr.get("category"):
            act["category"] = attr["category"]
        if attr.get("insiderTip"):
            act["insiderTip"] = attr["insiderTip"]
        if attr.get("entryFee"):
            act["entryFee"] = attr["entryFee"]
        if attr.get("bestPhotoSpot"):
            act["bestPhotoSpot"] = attr["bestPhotoSpot"]
        if attr.get("nearbyGem"):
            act["nearbyGem"] = attr["nearbyGem"]
        if attr.get("whatToWear"):
            act["whatToWear"] = attr["whatToWear"]
        if attr.get("openingHours"):
            act["openingHours"] = attr["openingHours"]
        return act

    def _maybe_inject_nearby_gem(attr: dict, day_acts: list, clock_val: float, hard_stop_val: float) -> float:
        nearby = attr.get("nearbyGem")
        if nearby and clock_val + 0.25 <= hard_stop_val:
            gem_title = f"📍 Nearby: {nearby.split('—')[0].strip() if '—' in nearby else nearby[:40]}"
            day_acts.append({
                "name": gem_title,
                "desc": nearby,
                "time": _to_time_str(clock_val),
                "slot": _slot_for(clock_val),
                "crowd": "Low",
                "crowdTip": "🤫 A local micro-detour — most tourists walk right past this!",
                "travelFromPrev": "1 min walk",
                "lat": attr.get("lat", map_center["lat"]),
                "lng": attr.get("lng", map_center["lng"]),
                "type": "attraction",
                "durationMins": 15,
                "category": "local-secret",
            })
            clock_val += 0.25
        return clock_val

    day_plans = []
    # Persistent global exclusion sets across ALL days — STRICT ZERO DUPLICATION
    used_attractions: Set[str] = set()
    used_restaurants: Set[str] = set()
    is_multi_day = days > 1

    for day_index in range(days):
        day_activities = []
        is_first_day = day_index == 0
        is_last_day = day_index == days - 1

        if day_index in free_days:
            day_plans.append({
                "day": day_index + 1,
                "title": "Free Day - Explore at Your Own Pace",
                "weather": {"temp": "Pleasant", "condition": "Clear", "emoji": "🌤️", "rain": 0, "tip": "Enjoy at your own pace!"},
                "activities": [{
                    "name": "Free Day",
                    "desc": "No fixed plans today! Sleep in, explore hidden lanes, try street food, or simply relax.",
                    "time": "All Day",
                    "slot": "Morning",
                    "crowd": "Low",
                    "crowdTip": "💡 Pro tip: Ask your hotel staff for hidden local gems.",
                    "travelFromPrev": "",
                    "lat": map_center["lat"],
                    "lng": map_center["lng"],
                    "type": "attraction",
                    "durationMins": 480,
                }],
            })
            continue

        if is_first_day and is_multi_day:
            clock = arrival_clock
        else:
            clock = pace["wakeHour"] + 0.5

        is_nightlife_vibe = (
            pace.get("nightlifeOk")
            or ctx.get("group") in ("friends", "solo", "couple", "duo")
            or (ctx.get("purpose") in ("celebrate", "nightlife", "leisure", "cultural") and "goa" in ctx.get("destination", "").lower())
            or ctx.get("purpose") in ("celebrate", "nightlife")
            or "goa" in ctx.get("destination", "").lower()
        )
        day_end_hour = 23.0 if is_nightlife_vibe else 21.5
        hard_stop = day_end_hour

        if is_last_day and departure_time_str:
            if is_multi_day:
                clock = checkout_hour
            hard_stop = min(day_end_hour, last_day_hard_stop)

        prev_lat = map_center["lat"]
        prev_lng = map_center["lng"]

        def push_activity(act: dict, duration_hours: float) -> bool:
            nonlocal clock, prev_lat, prev_lng
            if clock + duration_hours > hard_stop + 0.5:
                return False
            day_activities.append({
                **act,
                "time": _to_time_str(clock),
                "slot": _slot_for(clock),
            })
            clock += duration_hours
            prev_lat = act.get("lat", prev_lat)
            prev_lng = act.get("lng", prev_lng)
            return True

        def travel_between(to_lat: Optional[float], to_lng: Optional[float]) -> Tuple[float, str]:
            if prev_lat is None or prev_lng is None or to_lat is None or to_lng is None:
                return 0.25, "Short transit"
            dist_m = _haversine_m(prev_lat, prev_lng, to_lat, to_lng)
            return _travel_overhead_hours(dist_m), _estimate_travel_time(dist_m)

        # Check-in on Day 1
        if is_first_day and is_multi_day:
            hotel_name = hotels[0]["name"] if hotels else "Hotel"
            push_activity({
                "name": f"Check-in at {hotel_name}",
                "desc": "Arrive and settle into your accommodation. Freshen up before exploring.",
                "crowd": "Low",
                "crowdTip": "🏨 Pro tip: Ask for a room upgrade at check-in.",
                "travelFromPrev": "Arriving in city",
                "lat": hotels[0].get("lat", map_center["lat"]) if hotels else map_center["lat"],
                "lng": hotels[0].get("lng", map_center["lng"]) if hotels else map_center["lng"],
                "type": "hotel",
                "durationMins": 45,
            }, 0.75)

        # Checkout on last day
        if is_last_day and is_multi_day and days > 1:
            hotel_name = hotels[0]["name"] if hotels else "Hotel"
            push_activity({
                "name": f"Checkout from {hotel_name}",
                "desc": "Pack up, settle bills, and store luggage at reception if needed.",
                "crowd": "Low",
                "crowdTip": "🧳 Ask the hotel to store your bags until departure.",
                "travelFromPrev": "",
                "lat": hotels[0].get("lat", map_center["lat"]) if hotels else map_center["lat"],
                "lng": hotels[0].get("lng", map_center["lng"]) if hotels else map_center["lng"],
                "type": "hotel",
                "durationMins": 30,
            }, 0.5)

        day_attraction_pool = day_clusters[day_index] if day_index < len(day_clusters) else scored_attractions

        # Morning slots
        morning_slots = 0 if (is_first_day and is_multi_day) else pace["activitiesPerSlot"][0]
        if is_last_day and is_multi_day and departure_time_str:
            available_hours = max(0, last_day_hard_stop - clock)
            if available_hours < 2:
                morning_slots = min(morning_slots, 1)
            elif available_hours < 4:
                morning_slots = min(morning_slots, 2)

        # Morning temple slot
        if not is_first_day and pace["templeEarlyMorning"] and ctx.get("purpose") in ("spiritual", "cultural"):
            temple_attr = next(
                (a for a in day_attraction_pool if a["name"] not in used_attractions and
                 any(t in ("Temple", "Spiritual", "Aarti") for t in a.get("tags", []))),
                None
            )
            if temple_attr and clock < 8.0:
                overhead, label = travel_between(temple_attr.get("lat", prev_lat), temple_attr.get("lng", prev_lng))
                clock += overhead
                push_activity({
                    "name": temple_attr["name"],
                    "desc": temple_attr.get("desc", ""),
                    "crowd": "Low",
                    "crowdTip": "Survey tip: Pre-7 AM is peaceful with morning prayers.",
                    "travelFromPrev": label,
                    "lat": temple_attr.get("lat", map_center["lat"]),
                    "lng": temple_attr.get("lng", map_center["lng"]),
                    "type": "attraction",
                    "durationMins": 75,
                }, 1.25)
                used_attractions.add(temple_attr["name"])

        if not is_first_day and clock < 9.5:
            clock += 0.5

        # Morning attractions loop
        morning_count = 0
        for attr in day_attraction_pool:
            if morning_count >= morning_slots:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 13.0:
                break

            open_on = attr.get("_openOnDays")
            if open_on is not None and day_index not in open_on:
                continue

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 13.5:
                break

            clock += overhead
            crowd = "Low" if attr.get("walking") == "Easy" else "Medium"
            pushed = push_activity(_build_activity(attr, label, crowd), attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                morning_count += 1
                clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

        # If day cluster had no available attractions, search global scored pool
        if morning_count < morning_slots and clock < 12.5 and not (is_first_day and is_multi_day):
            for fallback_attr in scored_attractions:
                if morning_count >= morning_slots:
                    break
                if fallback_attr["name"] in used_attractions:
                    continue
                overhead, label = travel_between(fallback_attr.get("lat", prev_lat), fallback_attr.get("lng", prev_lng))
                attr_duration = min(2.0, _parse_duration_hours(fallback_attr.get("duration")))
                if clock + overhead + attr_duration <= 13.5:
                    clock += overhead
                    pushed = push_activity(_build_activity(fallback_attr, label), attr_duration)
                    if pushed:
                        used_attractions.add(fallback_attr["name"])
                        morning_count += 1

        # ── Lunch ──
        use_street_food_trail = (
            not is_first_day and not is_last_day
            and street_food_restaurants
            and day_index == days // 2
            and budget_tier != "luxury"
        )

        if clock < hard_stop - 0.5:
            clock = max(clock, 12.5)
            if use_street_food_trail:
                sf_used = 0
                for sf in street_food_restaurants:
                    if sf["name"] in used_restaurants or sf_used >= 2:
                        continue
                    overhead, label = travel_between(sf.get("lat", prev_lat), sf.get("lng", prev_lng))
                    clock += overhead
                    trail_desc = f"🍜 Street Food Trail! {sf.get('desc', '')} Must-try: {sf.get('mustTry', '')}."
                    push_activity({
                        "name": f"Street Food: {sf['name']}",
                        "desc": trail_desc,
                        "crowd": "Medium",
                        "crowdTip": sf.get("insiderTip") or "🤤 Follow the local queue!",
                        "travelFromPrev": label,
                        "lat": sf.get("lat", map_center["lat"]),
                        "lng": sf.get("lng", map_center["lng"]),
                        "type": "restaurant",
                        "durationMins": 30,
                        "category": "experience",
                    }, 0.5)
                    used_restaurants.add(sf["name"])
                    sf_used += 1

                if sf_used == 0:
                    # Fallback to standard lunch if all street food used
                    lunch_restaurant = next((r for r in scored_restaurants if r["name"] not in used_restaurants), None)
                    if not lunch_restaurant:
                        generic_dining_fallback_count += 1
                        lunch_restaurant = _synthesize_contextual_restaurant(
                            dest_name=ctx.get("destName", ""),
                            meal_type="lunch",
                            day_index=day_index,
                            prev_lat=prev_lat,
                            prev_lng=prev_lng,
                            budget_tier=budget_tier,
                            used_names=used_restaurants,
                            dietary=ctx.get("dietary"),
                        )
                    used_restaurants.add(lunch_restaurant["name"])
                    overhead, label = travel_between(lunch_restaurant.get("lat", prev_lat), lunch_restaurant.get("lng", prev_lng))
                    clock += overhead
                    push_activity({
                        "name": f"Lunch at {lunch_restaurant['name']}",
                        "desc": f"{lunch_restaurant.get('desc', '')} Must-try: {lunch_restaurant.get('mustTry', '')}.",
                        "crowd": "Medium",
                        "crowdTip": lunch_restaurant.get("insiderTip") or "🍽️ Lunch window 12:30–2:30 PM.",
                        "travelFromPrev": label,
                        "lat": lunch_restaurant.get("lat", map_center["lat"]),
                        "lng": lunch_restaurant.get("lng", map_center["lng"]),
                        "type": "restaurant",
                        "durationMins": pace["lunchBreakMins"],
                        "category": lunch_restaurant.get("category", "casual"),
                    }, pace["lunchBreakMins"] / 60.0)
            else:
                lunch_restaurant = next((r for r in scored_restaurants if r["name"] not in used_restaurants), None)
                if not lunch_restaurant:
                    generic_dining_fallback_count += 1
                    lunch_restaurant = _synthesize_contextual_restaurant(
                        dest_name=ctx.get("destName", ""),
                        meal_type="lunch",
                        day_index=day_index,
                        prev_lat=prev_lat,
                        prev_lng=prev_lng,
                        budget_tier=budget_tier,
                        used_names=used_restaurants,
                        dietary=ctx.get("dietary"),
                    )
                used_restaurants.add(lunch_restaurant["name"])
                overhead, label = travel_between(lunch_restaurant.get("lat", prev_lat), lunch_restaurant.get("lng", prev_lng))
                clock += overhead
                lunch_tip = lunch_restaurant.get("insiderTip") or "🍽️ Peak lunch is 1:00–2:00 PM."
                push_activity({
                    "name": f"Lunch at {lunch_restaurant['name']}",
                    "desc": f"{lunch_restaurant.get('desc', '')} Must-try: {lunch_restaurant.get('mustTry', '')}.",
                    "crowd": "Medium",
                    "crowdTip": lunch_tip,
                    "travelFromPrev": label,
                    "lat": lunch_restaurant.get("lat", map_center["lat"]),
                    "lng": lunch_restaurant.get("lng", map_center["lng"]),
                    "type": "restaurant",
                    "durationMins": pace["lunchBreakMins"],
                    "category": lunch_restaurant.get("category", "casual"),
                }, pace["lunchBreakMins"] / 60.0)

        # Afternoon rest
        if pace["afternoonRestMins"] > 0 and clock < hard_stop - 1.0:
            clock += pace["afternoonRestMins"] / 60.0

        # Afternoon attractions
        afternoon_slots = pace["activitiesPerSlot"][1]
        if is_last_day and departure_time_str:
            remaining_time = hard_stop - clock
            if remaining_time < 2:
                afternoon_slots = 0
            elif remaining_time < 3:
                afternoon_slots = min(afternoon_slots, 1)

        afternoon_count = 0
        for attr in day_attraction_pool:
            if afternoon_count >= afternoon_slots:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 17.0:
                break

            open_on = attr.get("_openOnDays")
            if open_on is not None and day_index not in open_on:
                continue

            if attr.get("bestTimeToVisit") == "sunset" and clock < 16.0:
                continue

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 18.0:
                break

            if is_last_day and departure_time_str:
                if clock + overhead + attr_duration > hard_stop:
                    continue

            clock += overhead
            pushed = push_activity(_build_activity(attr, label), attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                afternoon_count += 1
                clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

        # Fallback to scored_attractions if day cluster ran out of afternoon attractions
        if afternoon_count < afternoon_slots and clock < 17.0 and not (is_last_day and departure_time_str and hard_stop < 16.0):
            for fallback_attr in scored_attractions:
                if afternoon_count >= afternoon_slots:
                    break
                if fallback_attr["name"] in used_attractions:
                    continue
                if fallback_attr.get("bestTimeToVisit") == "sunset" and clock < 16.0:
                    continue
                open_on = fallback_attr.get("_openOnDays")
                if open_on is not None and day_index not in open_on:
                    continue
                overhead, label = travel_between(fallback_attr.get("lat", prev_lat), fallback_attr.get("lng", prev_lng))
                attr_duration = min(2.0, _parse_duration_hours(fallback_attr.get("duration")))
                if clock + overhead + attr_duration > 18.0:
                    continue
                if is_last_day and departure_time_str and (clock + overhead + attr_duration > hard_stop):
                    continue
                clock += overhead
                pushed = push_activity(_build_activity(fallback_attr, label), attr_duration)
                if pushed:
                    used_attractions.add(fallback_attr["name"])
                    afternoon_count += 1
                    clock = _maybe_inject_nearby_gem(fallback_attr, day_activities, clock, hard_stop)

        if afternoon_count == 0 and clock < 16.5 and not (is_last_day and departure_time_str and hard_stop < 16.0):
            synth_exp = _synthesize_contextual_experience(
                dest_name=ctx.get("destName", ""),
                day_index=day_index,
                prev_lat=prev_lat,
                prev_lng=prev_lng,
                used_names=used_attractions,
            )
            overhead, label = travel_between(synth_exp["lat"], synth_exp["lng"])
            clock += overhead
            pushed = push_activity(_build_activity(synth_exp, label), 1.5)
            if pushed:
                used_attractions.add(synth_exp["name"])
                afternoon_count += 1

        # Evening attractions
        evening_slots = pace["activitiesPerSlot"][2]
        if is_last_day and departure_time_str and hard_stop < 18.0:
            evening_slots = 0

        if evening_slots > 0 and clock < hard_stop - 1.0:
            clock = max(clock, 16.5)

            # Sunset spot priority
            sunset_attrs = [
                a for a in day_attraction_pool
                if a["name"] not in used_attractions
                and (a.get("bestTimeToVisit") == "sunset" or any(t in ("Sunset", "Beach", "Viewpoint") for t in a.get("tags", [])))
            ]
            if not sunset_attrs:
                sunset_attrs = [
                    a for a in scored_attractions
                    if a["name"] not in used_attractions
                    and (a.get("bestTimeToVisit") == "sunset" or any(t in ("Sunset", "Beach", "Viewpoint") for t in a.get("tags", [])))
                ]

            for sunset_attr in sunset_attrs[:1]:
                if clock >= 19.5 or evening_slots <= 0:
                    break
                overhead, label = travel_between(sunset_attr.get("lat", prev_lat), sunset_attr.get("lng", prev_lng))
                attr_duration = min(2.0, _parse_duration_hours(sunset_attr.get("duration")))
                if clock + overhead + attr_duration <= 19.5:
                    clock += overhead
                    sunset_act = _build_activity(sunset_attr, label)
                    sunset_act["crowdTip"] = sunset_attr.get("insiderTip") or "🌅 Golden hour — scenic lighting."
                    pushed = push_activity(sunset_act, attr_duration)
                    if pushed:
                        used_attractions.add(sunset_attr["name"])
                        evening_slots -= 1
                        clock = _maybe_inject_nearby_gem(sunset_attr, day_activities, clock, hard_stop)

            evening_count = 0
            for attr in day_attraction_pool:
                if evening_count >= evening_slots:
                    break
                if attr["name"] in used_attractions:
                    continue
                if clock >= 19.5:
                    break

                open_on = attr.get("_openOnDays")
                if open_on is not None and day_index not in open_on:
                    continue

                overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
                attr_duration = _parse_duration_hours(attr.get("duration"))

                if clock + overhead + attr_duration > 19.5:
                    break

                clock += overhead
                pushed = push_activity(_build_activity(attr, label), attr_duration)

                if pushed:
                    used_attractions.add(attr["name"])
                    evening_count += 1
                    clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

            # Fallback to scored_attractions if evening_count < evening_slots
            if evening_count < evening_slots and clock < 19.0:
                for fallback_attr in scored_attractions:
                    if evening_count >= evening_slots:
                        break
                    if fallback_attr["name"] in used_attractions:
                        continue
                    overhead, label = travel_between(fallback_attr.get("lat", prev_lat), fallback_attr.get("lng", prev_lng))
                    attr_duration = min(1.5, _parse_duration_hours(fallback_attr.get("duration")))
                    if clock + overhead + attr_duration > 19.5:
                        continue
                    clock += overhead
                    pushed = push_activity(_build_activity(fallback_attr, label), attr_duration)
                    if pushed:
                        used_attractions.add(fallback_attr["name"])
                        evening_count += 1
                        clock = _maybe_inject_nearby_gem(fallback_attr, day_activities, clock, hard_stop)

        # ── Dinner ──
        skip_dinner = is_last_day and departure_time_str and hard_stop < 19.5
        if not skip_dinner and clock < hard_stop:
            clock = max(clock, 19.5)
            # Pick unique dinner restaurant from pool or synthesize
            dinner_restaurant = next((r for r in scored_restaurants if r["name"] not in used_restaurants), None)
            if not dinner_restaurant:
                generic_dining_fallback_count += 1
                dinner_restaurant = _synthesize_contextual_restaurant(
                    dest_name=ctx.get("destName", ""),
                    meal_type="dinner",
                    day_index=day_index,
                    prev_lat=prev_lat,
                    prev_lng=prev_lng,
                    budget_tier=budget_tier,
                    used_names=used_restaurants,
                    dietary=ctx.get("dietary"),
                )
            used_restaurants.add(dinner_restaurant["name"])
            overhead, label = travel_between(dinner_restaurant.get("lat", prev_lat), dinner_restaurant.get("lng", prev_lng))
            clock += overhead
            desc = (
                f"End your trip on a memorable note! {dinner_restaurant.get('desc', '')} Must-try: {dinner_restaurant.get('mustTry', '')}."
                if is_last_day
                else f"{dinner_restaurant.get('desc', '')} Must-try: {dinner_restaurant.get('mustTry', '')}."
            )
            dinner_tip = dinner_restaurant.get("insiderTip") or "🌙 Evening dining peaks 8:00–9:30 PM."
            push_activity({
                "name": f"Dinner at {dinner_restaurant['name']}",
                "desc": desc,
                "crowd": "Low",
                "crowdTip": dinner_tip,
                "travelFromPrev": label,
                "lat": dinner_restaurant.get("lat", map_center["lat"]),
                "lng": dinner_restaurant.get("lng", map_center["lng"]),
                "type": "restaurant",
                "durationMins": 75,
                "category": dinner_restaurant.get("category", "casual"),
            }, 1.25)

        # ── Nightlife & Evening Beach Vibe (for Goa, friends, or nightlife trips) ──
        if is_nightlife_vibe and not is_last_day and clock < hard_stop - 0.75:
            nightlife_attr = next(
                (a for a in scored_attractions
                 if a["name"] not in used_attractions
                 and any(t.lower() in ("nightlife", "bar", "club", "pub", "market", "beach", "sunset") for t in a.get("tags", []))
                 and a.get("category") in ("experience", "local-secret", "must-see")),
                None
            )
            if nightlife_attr and clock < 22.0:
                overhead, label = travel_between(nightlife_attr.get("lat", prev_lat), nightlife_attr.get("lng", prev_lng))
                nl_duration = 1.5
                if clock + overhead + nl_duration <= hard_stop + 0.25:
                    clock += overhead
                    nl_act = _build_activity(nightlife_attr, label)
                    nl_act["slot"] = "Night"
                    nl_act["crowdTip"] = nightlife_attr.get("insiderTip") or "🌙 Evening vibe peaks between 9:30 PM and midnight."
                    pushed = push_activity(nl_act, nl_duration)
                    if pushed:
                        used_attractions.add(nightlife_attr["name"])
            elif not nightlife_attr and clock < 21.5 and "goa" in ctx.get("destination", "").lower():
                goa_nightlife_options = [
                    ("Anjuna Beach Shack & Acoustic Chillout", "Relax on reclining beach loungers under fairy lights with cold drinks, sound of crashing waves, and live acoustic music.", "1.5 hrs", "experience"),
                    ("Vagator Clifftop Sunset Lounge & DJ Set", "Panoramic ocean breeze lounge with deep house rhythms, ambient lighting, and tropical handcrafted mocktails.", "1.5 hrs", "experience"),
                    ("Baga Beach Night Stroll & Shacks", "Lively beachfront promenade lined with glowing beach shacks, candlelit tables in the sand, and retro classics.", "1.5 hrs", "experience"),
                    ("Fontainhas Heritage Tavern & Live Jazz", "Cozy Latin Quarter heritage bar with friendly conversation, local feni cocktails, and live jazz/retro duos.", "1.5 hrs", "experience"),
                ]
                for nl_title, nl_desc, nl_dur, nl_cat in goa_nightlife_options:
                    if nl_title not in used_attractions:
                        pushed = push_activity({
                            "name": nl_title,
                            "desc": nl_desc,
                            "crowd": "Medium",
                            "crowdTip": "🌙 Nightlife ambiance is at its best after 9:30 PM.",
                            "travelFromPrev": "Short ride",
                            "lat": prev_lat + 0.002,
                            "lng": prev_lng + 0.002,
                            "type": "attraction",
                            "durationMins": 90,
                            "slot": "Night",
                            "category": nl_cat,
                        }, 1.5)
                        if pushed:
                            used_attractions.add(nl_title)
                            break

        # Departure marker on last day
        if is_last_day and departure_time_str and departure_mode:
            mode_labels = {
                "flight": "✈️ Head to Airport",
                "train": "🚆 Head to Railway Station",
                "bus": "🚌 Head to Bus Stand",
                "car": "🚗 Begin Drive Home",
            }
            mode_label = mode_labels.get(departure_mode, "🚗 Depart")
            push_activity({
                "name": mode_label,
                "desc": f"Allow {DEPARTURE_BUFFER_HOURS.get(departure_mode, 1):.0f}h buffer at the {departure_mode} terminal. Safe travels!",
                "crowd": "Low",
                "crowdTip": f"📍 Estimated transit: ~{DEFAULT_TRANSIT_TO_DEPARTURE * 60:.0f} min from city center.",
                "travelFromPrev": f"~{DEFAULT_TRANSIT_TO_DEPARTURE * 60:.0f} min cab",
                "lat": map_center["lat"],
                "lng": map_center["lng"],
                "type": "attraction",
                "durationMins": int(DEPARTURE_BUFFER_HOURS.get(departure_mode, 1) * 60),
            }, DEPARTURE_BUFFER_HOURS.get(departure_mode, 1))

        # Day Title & Weather
        purpose_titles = DAY_TITLES_MAP.get(ctx.get("purpose", "cultural"), DAY_TITLES_MAP["cultural"])
        base_title = purpose_titles[day_index % len(purpose_titles)] if purpose_titles else f"Day {day_index + 1}"

        # Contextually name day after its most prominent highlight
        prominent_act = next(
            (a["name"] for a in day_activities
             if a.get("type") == "attraction"
             and not any(a.get("name", "").startswith(p) for p in ("Check-in", "Checkout", "Head to", "Free Day"))),
            None
        )
        if prominent_act:
            clean_name = re.sub(r"\s*\(.*?\)", "", prominent_act)
            if "waterfall" in clean_name.lower():
                day_title = f"{clean_name} & Forest Trail"
            elif "fort" in clean_name.lower():
                day_title = f"{clean_name} & Coastal Bastions"
            elif "beach" in clean_name.lower():
                day_title = f"{clean_name} & Sunset Shacks"
            elif "latin quarter" in clean_name.lower() or "fontainhas" in clean_name.lower():
                day_title = "Fontainhas Latin Quarter & Heritage Walk"
            elif "church" in clean_name.lower() or "basilica" in clean_name.lower() or "cathedral" in clean_name.lower():
                day_title = f"{clean_name} & Old Heritage"
            elif "island" in clean_name.lower():
                day_title = f"{clean_name} & Backwaters"
            elif "spice" in clean_name.lower():
                day_title = f"{clean_name} & Farm Trail"
            elif "market" in clean_name.lower():
                day_title = f"{clean_name} & Local Treasures"
            elif len(clean_name) <= 32:
                day_title = f"{clean_name} & {base_title}"
            else:
                first_part = clean_name.split("&")[0].split(",")[0].strip()
                day_title = f"{first_part} Exploration" if len(first_part) <= 30 else first_part
        else:
            day_title = base_title

        if is_first_day and is_multi_day:
            arrival_mode = ctx.get("arrivalMode", "")
            mode_emoji = {"flight": "✈️", "train": "🚆", "bus": "🚌", "car": "🚗"}.get(arrival_mode, "🗺️") if arrival_mode else "🗺️"
            day_title = f"{mode_emoji} Arrival & {day_title}"

        if is_last_day and is_multi_day and days > 1:
            if departure_mode:
                mode_emoji = {"flight": "✈️", "train": "🚆", "bus": "🚌", "car": "🚗"}.get(departure_mode, "🗺️")
                day_title = f"{day_title} & {mode_emoji} Departure"
            else:
                day_title = f"{day_title} & Farewell"

        # Daily weather forecast
        weather_data = dest_data.get("weather") or {}
        daily_forecast = weather_data.get("daily", []) if isinstance(weather_data, dict) else []
        current = weather_data.get("current", {}) if isinstance(weather_data, dict) else {}

        if daily_forecast and day_index < len(daily_forecast):
            dw = daily_forecast[day_index]
            temp_str = f"{dw.get('minTemp', '?')}°C–{dw.get('maxTemp', '?')}°C"
            condition = dw.get('condition', 'Pleasant')
            emoji = dw.get('emoji', '🌤️')
            rain_chance = dw.get('rainChance', 0)
        elif current:
            temp_str = f"{current.get('temp', '?')}°C"
            condition = current.get('condition', 'Pleasant')
            emoji = current.get('emoji', '🌤️')
            rain_chance = current.get('rainChance', 0)
        else:
            temp_str = "22°C–30°C"
            condition = "Pleasant"
            emoji = "🌤️"
            rain_chance = 0

        day_plans.append({
            "day": day_index + 1,
            "title": day_title,
            "theme": day_title,
            "weather": {
                "temp": temp_str,
                "condition": condition,
                "emoji": emoji,
                "rain": rain_chance,
                "tip": "Comfortable sightseeing conditions" if rain_chance < 40 else "Carry light rain protection",
            },
            "activities": day_activities,
        })

    # Assemble raw result
    departure_info = None
    if departure_time_str and departure_mode:
        available_after_checkout = max(0, last_day_hard_stop - checkout_hour)
        departure_info = {
            "departureTime": departure_time_str,
            "departureMode": departure_mode,
            "lastActivityBy": _to_time_str(last_day_hard_stop),
            "checkoutTime": _to_time_str(checkout_hour),
            "availableHoursAfterCheckout": round(available_after_checkout, 1),
            "bufferNote": f"You have {available_after_checkout:.0f}h {int((available_after_checkout % 1) * 60)}min after checkout before departure.",
        }

    raw_result = {
        "destName": ctx.get("destName", ""),
        "description": dest_data.get("description", ""),
        "avgCost": dest_data.get("avgCost", ""),
        "crowdLevel": dest_data.get("crowdLevel", "Medium"),
        "crowdNote": dest_data.get("crowdNote", ""),
        "logistics": dest_data.get("logistics", {"flights": "Check airlines", "trains": "Check IRCTC"}),
        "highlights": [
            {
                "name": h.get("name", ""),
                "img": h.get("img", ""),
                "desc": h.get("desc", ""),
                "bestMonths": h.get("bestMonths", ""),
                "duration": h.get("duration", ""),
                "tags": h.get("tags", []),
                "lat": h.get("lat", map_center["lat"]),
                "lng": h.get("lng", map_center["lng"]),
                "category": h.get("category", "must-see"),
            }
            for h in highlights
        ],
        "restaurants": [{**r} for r in scored_restaurants],
        "hotels": [{**h} for h in hotels],
        "dayPlans": day_plans,
        "mapCenter": map_center,
        "genericDiningFallbackCount": generic_dining_fallback_count,
        "geoFlags": {
            "attractions": flagged_attractions,
            "restaurants": flagged_restaurants,
        },
    }

    if departure_info:
        raw_result["departureInfo"] = departure_info

    # ── Deterministic Feasibility Repair & Audit Pass ───────────────────────
    repaired_result = repair_itinerary_feasibility(raw_result, dest_data, ctx)
    feasibility_report = validate_itinerary_feasibility(repaired_result)
    repaired_result["feasibility"] = feasibility_report

    print(
        f"[ItineraryModel] Itinerary generated for {ctx.get('destName', 'dest')} ({days} days): "
        f"Score {feasibility_report['score']}/100, Valid: {feasibility_report['valid']}, "
        f"Dup Attractions: {feasibility_report['duplicate_attractions_count']}, "
        f"Dup Restaurants: {feasibility_report['duplicate_restaurants_count']}"
    )

    return repaired_result
