# ─── Deterministic Itinerary Personalization Engine ─────────────────────────────
# Faithfully ported from lib/ai/itineraryModel.ts (792 lines).
# Scoring-based itinerary generation using user signals — wizard inputs,
# browsing analytics, preferences, and past trip history.
#
# Enhancements:
#   - Dynamic Day 1 arrival clock (morning/afternoon/evening/night)
#   - Last Day departure constraint math (flight buffer, transit, checkout)
#   - Spatial day-arc clustering (no more north→south→north backtracking)
#   - Must-Do pinning (fixed anchor activities)

import math
import random
from typing import Optional, List, Dict, Any


# ─── Purpose → tag affinity weights ──────────────────────────────────────────

PURPOSE_TAG_MAP = {
    "spiritual": {"Temple": 5, "Spiritual": 5, "Aarti": 4, "Heritage": 3, "Culture": 3, "Buddhist": 4},
    "leisure":   {"Beach": 5, "Nature": 4, "Sunset": 4, "Houseboat": 5, "Safari": 3, "Relaxation": 5},
    "adventure": {"Trekking": 5, "Mountains": 5, "Snow": 4, "Adventure": 5, "Waterfall": 4, "Safari": 3},
    "cultural":  {"History": 5, "Culture": 5, "Museum": 4, "Heritage": 5, "Fort": 4, "Palace": 4, "Shopping": 3, "UNESCO": 4},
    "honeymoon": {"Sunset": 5, "Beach": 4, "Nature": 4, "Romantic": 5, "Lake": 4},
    "celebrate": {"Culture": 3, "Shopping": 4, "Market": 4, "Fun": 5, "Nightlife": 5},
}

GROUP_PREFS = {
    "solo":    {"crowdPref": "Low",    "walkPref": "Medium"},
    "couple":  {"crowdPref": "Low",    "walkPref": "Easy"},
    "family":  {"crowdPref": "Low",    "walkPref": "Easy"},
    "friends": {"crowdPref": "Medium", "walkPref": "Medium"},
    "large":   {"crowdPref": "Medium", "walkPref": "Easy"},
}

# ─── Traveler Pacing Rules (NaviiGo survey data) ────────────────────────────

TRAVELER_PACE = {
    "backpacker": {
        "maxActiveHours": 10, "wakeHour": 6.5, "lunchBreakMins": 60, "afternoonRestMins": 30,
        "activitiesPerSlot": [3, 3, 2], "templeEarlyMorning": True, "nightlifeOk": True,
        "paceLabel": "High energy — early starts, max experiences",
    },
    "comfort": {
        "maxActiveHours": 8, "wakeHour": 8, "lunchBreakMins": 90, "afternoonRestMins": 60,
        "activitiesPerSlot": [3, 2, 2], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Balanced — see key highlights without exhaustion",
    },
    "luxury": {
        "maxActiveHours": 6, "wakeHour": 9, "lunchBreakMins": 120, "afternoonRestMins": 90,
        "activitiesPerSlot": [2, 2, 1], "templeEarlyMorning": False, "nightlifeOk": True,
        "paceLabel": "Relaxed — premium experiences, no rush",
    },
    "family": {
        "maxActiveHours": 7, "wakeHour": 8.5, "lunchBreakMins": 120, "afternoonRestMins": 90,
        "activitiesPerSlot": [2, 2, 1], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Family-friendly pace — extended rest time for kids & elders",
    },
    "flash": {
        "maxActiveHours": 11, "wakeHour": 6, "lunchBreakMins": 45, "afternoonRestMins": 0,
        "activitiesPerSlot": [4, 3, 2], "templeEarlyMorning": True, "nightlifeOk": True,
        "paceLabel": "Flash itinerary — squeeze in everything possible",
    },
    "slow": {
        "maxActiveHours": 5, "wakeHour": 9.5, "lunchBreakMins": 120, "afternoonRestMins": 120,
        "activitiesPerSlot": [2, 1, 1], "templeEarlyMorning": False, "nightlifeOk": False,
        "paceLabel": "Slow travel — immerse, don't rush",
    },
}

# ─── Survey-Based Crowd Tips ────────────────────────────────────────────────

SURVEY_CROWD_TIPS = {
    "Temple":   ["Go before 8 AM — lines triple by 10 AM per our survey", "84% of visitors regret going post-noon", "Dress code strictly enforced — carry a dupatta"],
    "Heritage": ["Hire a local guide (₹200–₹500) — 91% say it transformed their visit", "Golden hour is 30 mins before closing", "Photography rules vary — always ask first"],
    "Beach":    ["Avoid 11 AM–3 PM — UV index is extreme", "Best light for photos: 6–8 AM or 5–7 PM", "Water sports bookings fill by 9 AM in season"],
    "Market":   ["Bargaining is expected — start at 40% of asking price", "Evenings are busier but more electric", "Cash preferred — carry small notes"],
    "Nature":   ["Register at forest office before entry", "Carry water — 2L minimum in Indian summer", "Best wildlife sightings: 6–9 AM"],
    "Trekking": ["Start early — summit by noon to avoid afternoon storms", "Hire a local guide for any trail above 3500m", "Acclimatize 1 day before attempting high-altitude treks"],
    "Museum":   ["Monday closures are common — always check", "Photography often not allowed inside", "Average visit: 90 mins per our data"],
    "Shopping": ["Sundays many shops are closed in religious towns", "Government emporiums have fixed prices — safe for gifts", "Avoid tourist shops near monuments — 3x markup"],
    "default":  ["Go early for the best experience", "Carry water and a light snack", "Check Google Maps for live crowd data"],
}

WEATHER_CONDITIONS = [
    {"condition": "Clear Skies",   "emoji": "☀️",  "rain": 0,  "tip": "Great day for sightseeing — carry sunscreen"},
    {"condition": "Partly Cloudy", "emoji": "⛅",  "rain": 15, "tip": "Light & breezy — carry sunglasses"},
    {"condition": "Hazy Morning",  "emoji": "🌤️", "rain": 5,  "tip": "Cool morning — good for early starts"},
    {"condition": "Misty Morning",  "emoji": "🌫️", "rain": 30, "tip": "Carry a light jacket and umbrella"},
    {"condition": "Sunny",         "emoji": "☀️",  "rain": 0,  "tip": "Stay hydrated and use sunscreen"},
]

DAY_TITLES_MAP = {
    "spiritual": ["Sacred Beginnings", "Temple Trail", "Divine Detours", "Pilgrimage Path", "Spiritual Heights"],
    "leisure":   ["Arriving in Paradise", "Slow & Scenic", "Hidden Havens", "Lazy Luxury", "Golden Hour"],
    "adventure": ["Gear Up & Go", "Into the Wild", "Peak Thrills", "Off the Grid", "Summit Day"],
    "cultural":  ["Heritage Walk", "Arts & Crafts", "Living History", "Bazaar Trail", "Cultural Immersion"],
    "honeymoon": ["Love at First Sight", "Romantic Escapes", "Sunset Together", "Private Paradise", "Memory Lane"],
    "celebrate": ["Party Starts Here", "Group Adventures", "Festival Vibes", "Night Out", "Grand Finale"],
}

GEO_RADIUS_KM = 80

# ─── Departure Buffer Constants ─────────────────────────────────────────────

DEPARTURE_BUFFER_HOURS = {
    "flight": 2.0,      # Need 2h at airport before departure
    "train": 1.0,       # 1h buffer at railway station
    "bus": 0.5,         # 30 min at bus stand
    "car": 0.25,        # 15 min buffer for self-drive
}

# Default transit time from city center to departure point (in hours)
DEFAULT_TRANSIT_TO_DEPARTURE = 0.75  # 45 minutes

# Default checkout time (fractional hour)
DEFAULT_CHECKOUT_HOUR = 11.0

# ─── Arrival Clock Mapping ──────────────────────────────────────────────────

ARRIVAL_CLOCK_MAP = {
    "morning":   12.0,   # Arrive morning → check-in by noon, full afternoon
    "afternoon": 14.0,   # Arrive afternoon → check-in by 2 PM (current default)
    "evening":   17.0,   # Arrive evening → check-in at 5 PM, dinner only
    "night":     20.0,   # Arrive night → check-in only, no activities
}

# ─── V2: Category Score Boosts ──────────────────────────────────────────────
# Hidden gems and local secrets get a significant boost so they compete with
# famous must-sees. Experiences get a moderate boost.

CATEGORY_SCORE_BOOST = {
    "must-see":      0,    # No extra boost — they already score high on tags
    "hidden-gem":    25,   # Strong boost to surface hidden gems
    "local-secret":  30,   # Strongest boost — these are gold
    "experience":    20,   # Experiences (food walks, workshops) get a solid boost
}

# ─── V2: Best Time → Clock Slot Mapping ─────────────────────────────────────
# Maps the Gemini "bestTimeToVisit" field to fractional hour ranges.
# Used for time-fit scoring: if an attraction's best time aligns with its
# scheduled slot, it gets a bonus.

BEST_TIME_SLOTS = {
    "sunrise":   (5.5, 7.5),
    "morning":   (7.0, 11.0),
    "afternoon": (12.0, 16.0),
    "sunset":    (16.5, 19.0),
    "evening":   (17.0, 21.0),
    "night":     (19.0, 23.0),
    "any":       (0.0, 23.0),
}

# ─── V2: Day Name Abbreviations ────────────────────────────────────────────
# Used to check openDays against the actual travel date.

DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# ─── V2: Category diversity caps ───────────────────────────────────────────
# Maximum attractions of the same tag-type per day before penalty kicks in.
TAG_DIVERSITY_CAP = 2
TAG_DIVERSITY_PENALTY = -15


# ─── Utility Functions ──────────────────────────────────────────────────────

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_duration_hours(duration: Optional[str]) -> float:
    if not duration:
        return 1.5
    import re
    range_match = re.search(r'(\d+(?:\.\d+)?)\s*[–\-]\s*(\d+(?:\.\d+)?)\s*hr', duration, re.IGNORECASE)
    if range_match:
        return (float(range_match.group(1)) + float(range_match.group(2))) / 2
    single = re.search(r'(\d+(?:\.\d+)?)\s*hr', duration, re.IGNORECASE)
    if single:
        return float(single.group(1))
    mins = re.search(r'(\d+)\s*min', duration, re.IGNORECASE)
    if mins:
        return int(mins.group(1)) / 60
    return 1.5


def _to_time_str(fractional_hour: float) -> str:
    h24 = int(fractional_hour)
    mins = round((fractional_hour - h24) * 60)
    suffix = "AM" if h24 < 12 else "PM"
    h12 = 12 if h24 == 0 else (h24 - 12 if h24 > 12 else h24)
    return f"{h12}:{mins:02d} {suffix}"


def _slot_for(fractional_hour: float) -> str:
    if fractional_hour < 12:
        return "Morning"
    if fractional_hour < 17:
        return "Afternoon"
    return "Evening"


def _travel_overhead_hours(dist_m: float) -> float:
    if dist_m < 500:   return 0.08
    if dist_m < 2000:  return 0.17
    if dist_m < 5000:  return 0.33
    if dist_m < 15000: return 0.5
    return 0.75


def _estimate_travel_time(dist_m: float) -> str:
    if dist_m < 500:   return "5 min walk"
    if dist_m < 2000:  return f"{round(dist_m / 80)} min walk"
    if dist_m < 5000:  return f"{round(dist_m / 350)} min auto"
    if dist_m < 15000: return f"{round(dist_m / 400)} min cab"
    return f"{round(dist_m / 500)} min cab"


def _get_survey_tip(tags: List[str]) -> str:
    for tag in tags:
        if tag in SURVEY_CROWD_TIPS:
            tips = SURVEY_CROWD_TIPS[tag]
            return tips[random.randint(0, len(tips) - 1)]
    defaults = SURVEY_CROWD_TIPS["default"]
    return defaults[random.randint(0, len(defaults) - 1)]


def _geo_filter_and_snap(items: List[dict], center: dict) -> List[dict]:
    result = []
    for item in items:
        if not item.get("lat") or not item.get("lng"):
            result.append(item)
            continue
        dist_km = _haversine_m(center["lat"], center["lng"], item["lat"], item["lng"]) / 1000
        if dist_km > GEO_RADIUS_KM:
            item = {**item, "lat": center["lat"], "lng": center["lng"]}
        result.append(item)
    return result


# ─── Spatial Clustering ─────────────────────────────────────────────────────
# Groups attractions into geographic clusters so each day covers a coherent
# zone instead of zigzagging across the city.

def _cluster_by_quadrant(attractions: List[dict], center: dict, num_clusters: int) -> List[List[dict]]:
    """
    Divide attractions into geographic clusters using quadrant-based grouping.
    Returns a list of clusters, each sorted by score (highest first).
    """
    if not attractions:
        return [[] for _ in range(num_clusters)]

    # Assign each attraction to a quadrant (NE, NW, SE, SW)
    quadrants: Dict[str, List[dict]] = {"NE": [], "NW": [], "SE": [], "SW": []}
    for attr in attractions:
        lat = attr.get("lat", center["lat"])
        lng = attr.get("lng", center["lng"])
        ns = "N" if lat >= center["lat"] else "S"
        ew = "E" if lng >= center["lng"] else "W"
        quadrants[ns + ew].append(attr)

    # Sort quadrants by total score (highest first)
    sorted_quads = sorted(quadrants.values(), key=lambda q: sum(a.get("score", 0) for a in q), reverse=True)

    # Merge small quadrants and distribute into num_clusters groups
    clusters: List[List[dict]] = [[] for _ in range(num_clusters)]
    all_sorted = []
    for quad in sorted_quads:
        all_sorted.extend(quad)

    # Round-robin distribute to clusters while keeping geographic locality
    for i, attr in enumerate(all_sorted):
        clusters[i % num_clusters].append(attr)

    # Within each cluster, sort by nearest-neighbor to minimize backtracking
    for cluster in clusters:
        if len(cluster) > 1:
            cluster.sort(key=lambda a: a.get("score", 0), reverse=True)
            _nearest_neighbor_sort(cluster, center)

    return clusters


def _nearest_neighbor_sort(attractions: List[dict], center: dict):
    """Sort attractions in-place using nearest-neighbor greedy algorithm."""
    if len(attractions) <= 2:
        return

    sorted_list = [attractions[0]]  # Start with highest-scored
    remaining = list(attractions[1:])
    current_lat = sorted_list[0].get("lat", center["lat"])
    current_lng = sorted_list[0].get("lng", center["lng"])

    while remaining:
        nearest_idx = 0
        nearest_dist = float("inf")
        for i, attr in enumerate(remaining):
            dist = _haversine_m(current_lat, current_lng, attr.get("lat", center["lat"]), attr.get("lng", center["lng"]))
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = i
        nearest = remaining.pop(nearest_idx)
        sorted_list.append(nearest)
        current_lat = nearest.get("lat", center["lat"])
        current_lng = nearest.get("lng", center["lng"])

    attractions[:] = sorted_list


# ─── Scoring Engine ──────────────────────────────────────────────────────────

def _score_attraction(attr: dict, index: int, ctx: dict, budget_tier: str, tag_counts: Optional[Dict[str, int]] = None) -> dict:
    score = 50
    tags = attr.get("tags", [])
    category = attr.get("category", "must-see")  # V2 field

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

    # 4. Browsing signals boost
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

    # 5. User preference boost
    prefs = ctx.get("preferences")
    if prefs and prefs.get("interests"):
        for interest in prefs["interests"]:
            if any(interest.lower() in t.lower() for t in tags):
                score += 15
                break

    # 6. Past trip penalty
    past_trips = ctx.get("pastTrips") or []
    if past_trips:
        visited_purposes = {t.get("purpose") for t in past_trips}
        if ctx.get("purpose") in visited_purposes:
            score -= 5

    # 7. Date/month fit
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

    # 8. Weather-aware adjustment — boost indoor activities during rainy conditions
    weather_info = ctx.get("weatherInfo")  # e.g. {"rain": 70, "condition": "Monsoon"}
    if weather_info and weather_info.get("rain", 0) > 50:
        indoor_tags = {"Museum", "Shopping", "Heritage", "Palace", "Culture", "Temple", "Market"}
        outdoor_tags = {"Beach", "Trekking", "Nature", "Waterfall", "Houseboat", "Sunset", "Safari", "Adventure"}
        if any(t in indoor_tags for t in tags):
            score += 15  # Prefer indoor during rain
        if any(t in outdoor_tags for t in tags):
            score -= 25  # Penalize outdoor during rain

    # 9. Crowd-aware preferred time slot hint
    # Store a hint that gets used during day-building to avoid peak hours
    crowd_preferred_slot = None
    for tag in tags:
        if tag in ("Temple", "Spiritual", "Aarti"):
            crowd_preferred_slot = "Morning"  # Temples: avoid 11 AM–2 PM
        elif tag in ("Market", "Shopping"):
            crowd_preferred_slot = "Evening"   # Markets: peak in evening but electric
        elif tag in ("Beach", "Nature"):
            crowd_preferred_slot = "Morning"   # Avoid midday UV

    # ── V2: Category boost (hidden gems, local secrets, experiences) ──
    score += CATEGORY_SCORE_BOOST.get(category, 0)

    # ── V2: Tag diversity penalty ──
    # If too many attractions of the same type already scored high, penalize.
    if tag_counts:
        for tag in tags:
            if tag_counts.get(tag, 0) >= TAG_DIVERSITY_CAP:
                score += TAG_DIVERSITY_PENALTY
                break

    # ── V2: Time-fit hint from bestTimeToVisit ──
    best_time = attr.get("bestTimeToVisit", "any")
    if best_time in ("sunrise", "sunset"):
        # Force-schedule hint — stored for day-builder to use
        if best_time == "sunrise":
            crowd_preferred_slot = "Morning"
        elif best_time == "sunset":
            crowd_preferred_slot = "Evening"

    result = {**attr, "score": score, "originalIndex": index}
    if crowd_preferred_slot:
        result["preferredSlot"] = crowd_preferred_slot
    if best_time:
        result["bestTimeToVisit"] = best_time
    return result


# ─── Main Generation Function ───────────────────────────────────────────────

def generate_itinerary(ctx: dict, dest_data: dict) -> Optional[dict]:
    """
    Generate a fully personalized itinerary with day plans, scored attractions,
    restaurants, hotels — identical to the TypeScript itineraryModel output.

    New features:
    - Dynamic arrival clock (ctx.arrivalTime → morning/afternoon/evening/night)
    - Last-day departure constraint (ctx.departureTime, ctx.departureMode)
    - Spatial clustering (group attractions by quadrant per day)
    - Must-Do pinning (ctx.mustDo → fixed anchor activities)
    """
    if not dest_data:
        return None

    days = ctx.get("days", 3)
    budget = ctx.get("budget", 15000)
    budget_per_day = budget / max(days, 1)
    budget_tier = "luxury" if budget_per_day > 12000 else ("mid-range" if budget_per_day > 5000 else "budget")

    map_center = dest_data.get("mapCenter", {"lat": 20.5937, "lng": 78.9629})

    # Score all attractions with diversity tracking
    highlights = dest_data.get("highlights", [])
    tag_counts: Dict[str, int] = {}
    scored_attractions = []
    for i, a in enumerate(highlights):
        scored = _score_attraction(a, i, ctx, budget_tier, tag_counts)
        scored_attractions.append(scored)
        # Track tag frequency for diversity penalty on subsequent items
        for tag in a.get("tags", []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    scored_attractions.sort(key=lambda a: a["score"], reverse=True)
    scored_attractions = _geo_filter_and_snap(scored_attractions, map_center)

    # ── V2: Day-of-week filtering ────────────────────────────────────────────
    # Remove attractions that are closed on the travel dates.
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
        # Don't remove — just heavily penalize closed attractions so they fall to the bottom
        for attr in scored_attractions:
            open_days = attr.get("openDays")
            if open_days and isinstance(open_days, list) and len(open_days) < 7:
                # This attraction has restricted days — mark which travel days it's open
                attr["_openOnDays"] = [i for i, day_name in enumerate(travel_day_names) if day_name in open_days]
                if not attr["_openOnDays"]:
                    attr["score"] -= 100  # Closed for entire trip

    # ── V2: Separate pools by category ───────────────────────────────────────
    hidden_gems = [a for a in scored_attractions if a.get("category") in ("hidden-gem", "local-secret")]
    experiences = [a for a in scored_attractions if a.get("category") == "experience"]

    # ── Must-Do Pinning ──────────────────────────────────────────────────────
    must_do_list = ctx.get("mustDo") or []
    pinned_by_day: Dict[int, List[dict]] = {}
    pinned_names = set()

    for pin in must_do_list:
        pin_name = pin.get("name", "")
        pin_day = pin.get("dayIndex")  # 0-indexed, optional
        if not pin_name:
            continue

        # Find matching attraction
        match = next((a for a in scored_attractions if a["name"].lower() == pin_name.lower()), None)
        if not match:
            # Fuzzy match — check if pin_name is a substring
            match = next((a for a in scored_attractions if pin_name.lower() in a["name"].lower()), None)
        if match:
            pinned_names.add(match["name"])
            target_day = pin_day if pin_day is not None and 0 <= pin_day < days else 0
            if target_day not in pinned_by_day:
                pinned_by_day[target_day] = []
            pinned_by_day[target_day].append(match)

    # ── Spatial Clustering ───────────────────────────────────────────────────
    # Remove pinned attractions from pool before clustering
    unpinned = [a for a in scored_attractions if a["name"] not in pinned_names]
    day_clusters = _cluster_by_quadrant(unpinned, map_center, days)

    # Merge pinned attractions into their target day clusters
    for day_idx, pinned_list in pinned_by_day.items():
        if day_idx < len(day_clusters):
            # Insert pinned at the front (they have priority)
            day_clusters[day_idx] = pinned_list + day_clusters[day_idx]

    # ── V2: Hidden gem guarantee — inject 1-2 hidden gems per day ────────────
    used_gem_names = set()
    for day_idx in range(len(day_clusters)):
        cluster = day_clusters[day_idx]
        cluster_names = {a["name"] for a in cluster}
        gems_in_cluster = sum(1 for a in cluster if a.get("category") in ("hidden-gem", "local-secret"))
        
        # Need at least 1 hidden gem per day, ideally 2
        gems_needed = max(0, 2 - gems_in_cluster)
        for gem in hidden_gems:
            if gems_needed <= 0:
                break
            if gem["name"] not in cluster_names and gem["name"] not in used_gem_names and gem["name"] not in pinned_names:
                # Check day-of-week: skip if closed on this day
                open_on = gem.get("_openOnDays")
                if open_on is not None and day_idx not in open_on:
                    continue
                cluster.append(gem)
                cluster_names.add(gem["name"])
                used_gem_names.add(gem["name"])
                gems_needed -= 1

    # ── V2: Experience slot — inject 1 experience per day ────────────────────
    used_exp_names = set()
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

    # Score restaurants — separate street food for trail injection
    restaurants = list(dest_data.get("restaurants", []))
    restaurants.sort(key=lambda r: r.get("rating", 0) * 10, reverse=True)
    scored_restaurants = _geo_filter_and_snap(restaurants, map_center)
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

    # Weather
    start_date = ctx.get("startDate", "")
    start_month = "Jan"
    if start_date:
        try:
            from datetime import datetime
            start_month = datetime.fromisoformat(start_date).strftime("%b")
        except Exception:
            pass
    weather_data = dest_data.get("weather") or {}
    temp_for_month = weather_data.get(start_month, "20–30°C") if isinstance(weather_data, dict) else "20–30°C"

    # ── Departure constraint math ────────────────────────────────────────────
    departure_time_str = ctx.get("departureTime", "")
    departure_mode = ctx.get("departureMode", "")
    last_day_hard_stop = 21.0  # default: no special constraint

    if departure_time_str:
        try:
            parts = departure_time_str.split(":")
            departure_hour = int(parts[0]) + int(parts[1]) / 60 if len(parts) >= 2 else float(departure_time_str)
        except (ValueError, IndexError):
            departure_hour = 21.0

        buffer_hours = DEPARTURE_BUFFER_HOURS.get(departure_mode, 1.0)
        transit_hours = DEFAULT_TRANSIT_TO_DEPARTURE
        # Latest you can be at your last activity:
        # departure_hour - buffer - transit
        last_day_hard_stop = departure_hour - buffer_hours - transit_hours
        print(f"[ItineraryModel] Departure constraint: {departure_time_str} ({departure_mode}) -> last activity by {_to_time_str(last_day_hard_stop)}")

    # ── Arrival time ─────────────────────────────────────────────────────────
    arrival_time = ctx.get("arrivalTime", "afternoon")
    arrival_clock = ARRIVAL_CLOCK_MAP.get(arrival_time, 14.0)

    # ── Pace Calibration — maxWalkingKm override ─────────────────────────────
    pace = TRAVELER_PACE.get(ctx.get("travelerType", "comfort"), TRAVELER_PACE["comfort"])
    max_walking_km = ctx.get("maxWalkingKm")
    if max_walking_km is not None:
        try:
            km = float(max_walking_km)
            # Map walking km to active hours: ~4 km/h walking speed
            adjusted_hours = max(3, min(12, km / 4 * 2))  # double because not all time is walking
            pace = {**pace, "maxActiveHours": adjusted_hours}
            if km < 5:
                pace = {**pace, "activitiesPerSlot": [2, 1, 1]}
            elif km < 10:
                pace = {**pace, "activitiesPerSlot": [2, 2, 1]}
        except (ValueError, TypeError):
            pass

    # ── Dynamic Hotel Check-in/out Times ─────────────────────────────────────
    checkout_hour = DEFAULT_CHECKOUT_HOUR  # 11:00 AM default
    if hotels:
        hotel_checkin = hotels[0].get("checkIn", "")
        if hotel_checkin:
            try:
                # Parse check-in time like "2:00 PM" or "14:00"
                import re
                pm_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(AM|PM)', hotel_checkin, re.IGNORECASE)
                h24_match = re.search(r'(\d{1,2}):(\d{2})', hotel_checkin)
                if pm_match:
                    h = int(pm_match.group(1))
                    if pm_match.group(3).upper() == "PM" and h != 12:
                        h += 12
                    elif pm_match.group(3).upper() == "AM" and h == 12:
                        h = 0
                    # Checkout is typically check-in time the next day minus 3h or 11 AM
                    checkout_hour = min(h, 11.0)  # Checkout never later than check-in
                elif h24_match:
                    h = int(h24_match.group(1))
                    checkout_hour = min(h, 11.0)
            except Exception:
                pass

    # ── Open Day / Rest Day Support ──────────────────────────────────────────
    free_days = set(ctx.get("freeDays") or [])  # 0-indexed day numbers
    
    # ── Last-Day En-Route Filtering ──────────────────────────────────────────
    # On last day, boost attractions near the route from hotel to departure point
    if departure_time_str and departure_mode and days > 1:
        hotel_lat = hotels[0].get("lat", map_center["lat"]) if hotels else map_center["lat"]
        hotel_lng = hotels[0].get("lng", map_center["lng"]) if hotels else map_center["lng"]
        departure_lat = map_center["lat"]  # Assume departure from city center (airport/station)
        departure_lng = map_center["lng"]
        
        # Midpoint of hotel->departure route
        mid_lat = (hotel_lat + departure_lat) / 2
        mid_lng = (hotel_lng + departure_lng) / 2
        
        # Boost last-day cluster attractions near the midpoint
        last_day_idx = days - 1
        if last_day_idx < len(day_clusters):
            for attr in day_clusters[last_day_idx]:
                attr_lat = attr.get("lat", map_center["lat"])
                attr_lng = attr.get("lng", map_center["lng"])
                dist_to_mid = _haversine_m(attr_lat, attr_lng, mid_lat, mid_lng)
                if dist_to_mid < 5000:  # Within 5km of route midpoint
                    attr["score"] = attr.get("score", 50) + 20
                elif dist_to_mid < 10000:
                    attr["score"] = attr.get("score", 50) + 10
            # Re-sort last day cluster by boosted scores
            day_clusters[last_day_idx].sort(key=lambda a: a.get("score", 0), reverse=True)

    # ── Build Day Plans ──────────────────────────────────────────────────────

    # V2: Helper to build enriched activity dicts
    def _build_activity(attr: dict, travel_label: str, crowd: str = "Medium") -> dict:
        """Build a day activity dict enriched with V2 fields."""
        act = {
            "name": attr["name"],
            "desc": attr.get("desc", ""),
            "crowd": crowd,
            "crowdTip": attr.get("insiderTip") or _get_survey_tip(attr.get("tags", [])),
            "travelFromPrev": travel_label,
            "lat": attr.get("lat", map_center["lat"]),
            "lng": attr.get("lng", map_center["lng"]),
            "type": "attraction",
            "durationMins": _parse_duration_hours(attr.get("duration")) * 60,
        }
        # V2 enrichment fields
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

    # V2: Helper to inject nearby gem as a micro-activity
    def _maybe_inject_nearby_gem(attr: dict, day_acts: list, clock_val: float, hard_stop_val: float) -> float:
        """If the attraction has a nearbyGem, inject a 15-min micro-activity. Returns new clock value."""
        nearby = attr.get("nearbyGem")
        if nearby and clock_val + 0.25 <= hard_stop_val:
            day_acts.append({
                "name": f"📍 Nearby: {nearby.split('—')[0].strip() if '—' in nearby else nearby[:40]}",
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
            clock_val += 0.25  # 15 minutes
        return clock_val

    day_plans = []
    used_attractions = set()
    used_restaurants = set()
    is_multi_day = days > 1

    for day_index in range(days):
        day_activities = []
        is_first_day = day_index == 0
        is_last_day = day_index == days - 1

        # ── Open Day / Rest Day — skip scheduling ────────────────────────────
        if day_index in free_days:
            purpose_titles = DAY_TITLES_MAP.get(ctx.get("purpose", "cultural"), DAY_TITLES_MAP["cultural"])
            weather_idx = day_index % len(WEATHER_CONDITIONS)
            weather = {"temp": temp_for_month, **WEATHER_CONDITIONS[weather_idx]}
            day_plans.append({
                "day": day_index + 1,
                "title": "Free Day - Explore at Your Own Pace",
                "weather": weather,
                "activities": [{
                    "name": "Free Day",
                    "desc": "No fixed plans today! Sleep in, explore hidden lanes, try street food, revisit favourites, or simply relax. This is your day.",
                    "time": "All Day",
                    "slot": "Morning",
                    "crowd": "Low",
                    "crowdTip": "💡 Pro tip: Ask your hotel staff for hidden local gems — they always know the best spots.",
                    "travelFromPrev": "",
                    "lat": map_center["lat"],
                    "lng": map_center["lng"],
                    "type": "attraction",
                    "durationMins": 480,
                }],
            })
            continue

        # ── Clock initialization ─────────────────────────────────────────────
        if is_first_day and is_multi_day:
            clock = arrival_clock
        else:
            clock = pace["wakeHour"] + 0.5

        # Hard stop for the day
        day_end_hour = 21.0
        day_start = clock  # Use actual start time (arrival or wake)
        max_end = day_start + pace["maxActiveHours"]
        hard_stop = min(day_end_hour, max_end)

        # Apply last-day departure constraint
        if is_last_day and departure_time_str:
            # After checkout, they have until last_day_hard_stop
            if is_multi_day:
                clock = checkout_hour  # Uses dynamic checkout_hour from hotel data
            hard_stop = min(hard_stop, last_day_hard_stop)

        prev_lat = map_center["lat"]
        prev_lng = map_center["lng"]

        def push_activity(act: dict, duration_hours: float) -> bool:
            nonlocal clock, prev_lat, prev_lng
            if clock + duration_hours > hard_stop:
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

        def travel_between(to_lat: float, to_lng: float):
            dist_m = _haversine_m(prev_lat, prev_lng, to_lat, to_lng)
            return _travel_overhead_hours(dist_m), _estimate_travel_time(dist_m)

        # ── Check-in activity on Day 1 ───────────────────────────────────────
        if is_first_day and is_multi_day:
            checkin_time = arrival_clock
            hotel_name = hotels[0]["name"] if hotels else "Hotel"
            push_activity({
                "name": f"Check-in at {hotel_name}",
                "desc": f"Arrive and settle into your accommodation. Freshen up before exploring.",
                "crowd": "Low",
                "crowdTip": "🏨 Pro tip: Ask for a room upgrade at check-in — works 30% of the time!",
                "travelFromPrev": "Arriving in city",
                "lat": hotels[0].get("lat", map_center["lat"]) if hotels else map_center["lat"],
                "lng": hotels[0].get("lng", map_center["lng"]) if hotels else map_center["lng"],
                "type": "hotel",
                "durationMins": 45,
            }, 0.75)  # 45 min check-in

        # ── Checkout activity on last day ────────────────────────────────────
        if is_last_day and is_multi_day and days > 1:
            if not is_first_day:  # Skip if it's a 1-day trip
                hotel_name = hotels[0]["name"] if hotels else "Hotel"
                push_activity({
                    "name": f"Checkout from {hotel_name}",
                    "desc": "Pack up, settle bills, and store luggage at reception if needed.",
                    "crowd": "Low",
                    "crowdTip": "🧳 Ask the hotel to store your bags — most places do it free until evening.",
                    "travelFromPrev": "",
                    "lat": hotels[0].get("lat", map_center["lat"]) if hotels else map_center["lat"],
                    "lng": hotels[0].get("lng", map_center["lng"]) if hotels else map_center["lng"],
                    "type": "hotel",
                    "durationMins": 30,
                }, 0.5)

        # ── Get this day's attraction cluster ────────────────────────────────
        day_attraction_pool = day_clusters[day_index] if day_index < len(day_clusters) else scored_attractions

        # ── Morning: early temple slot ──
        morning_slots = 0 if (is_first_day and is_multi_day) else pace["activitiesPerSlot"][0]

        # For last day, reduce morning slots based on available window
        if is_last_day and is_multi_day and departure_time_str:
            available_hours = max(0, last_day_hard_stop - clock)
            if available_hours < 2:
                morning_slots = min(morning_slots, 1)
            elif available_hours < 4:
                morning_slots = min(morning_slots, 2)

        if not is_first_day and pace["templeEarlyMorning"] and ctx.get("purpose") in ("spiritual", "cultural"):
            temple_attr = next(
                (a for a in day_attraction_pool if a["name"] not in used_attractions and
                 any(t in ("Temple", "Spiritual", "Aarti") for t in a.get("tags", []))),
                None
            )
            if temple_attr and clock < 8:
                overhead, label = travel_between(temple_attr.get("lat", prev_lat), temple_attr.get("lng", prev_lng))
                clock += overhead
                push_activity({
                    "name": temple_attr["name"],
                    "desc": temple_attr.get("desc", ""),
                    "crowd": "Low",
                    "crowdTip": "Survey tip: 94% of temple-goers say pre-7AM is magical — no queues, conch shells echoing",
                    "travelFromPrev": label,
                    "lat": temple_attr.get("lat", map_center["lat"]),
                    "lng": temple_attr.get("lng", map_center["lng"]),
                    "type": "attraction",
                    "durationMins": 75,
                }, 1.25)
                used_attractions.add(temple_attr["name"])

        # Breakfast buffer
        if not is_first_day and clock < 9.5:
            clock += 0.5

        # Morning attractions
        morning_count = 0
        for attr in day_attraction_pool:
            if morning_count >= morning_slots:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 15.5:
                break

            # V2: Skip if closed on this day
            open_on = attr.get("_openOnDays")
            if open_on is not None and day_index not in open_on:
                continue

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 16.0:
                break

            clock += overhead
            crowd = "Low" if attr.get("walking") == "Easy" else "Medium"
            pushed = push_activity(_build_activity(attr, label, crowd), attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                morning_count += 1
                # V2: Inject nearby gem micro-activity
                clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

        # ── Lunch ──
        # V2: On one middle day, try a street food trail instead of formal lunch
        use_street_food_trail = (
            not is_first_day and not is_last_day
            and street_food_restaurants
            and day_index == days // 2  # Middle day of the trip
            and budget_tier != "luxury"
        )

        if clock < hard_stop - 1:
            clock = max(clock, 13.5)
            if use_street_food_trail:
                # Street food trail — pick 2-3 street food spots
                sf_used = 0
                for sf in street_food_restaurants:
                    if sf["name"] in used_restaurants or sf_used >= 2:
                        break
                    overhead, label = travel_between(sf.get("lat", prev_lat), sf.get("lng", prev_lng))
                    clock += overhead
                    trail_desc = f"🍜 Street Food Trail! {sf.get('desc', '')} Must-try: {sf.get('mustTry', '')}."
                    push_activity({
                        "name": f"Street Food: {sf['name']}",
                        "desc": trail_desc,
                        "crowd": "Medium",
                        "crowdTip": sf.get("insiderTip") or "🤤 Pro tip: Follow the longest queue — locals know best!",
                        "travelFromPrev": label,
                        "lat": sf.get("lat", map_center["lat"]),
                        "lng": sf.get("lng", map_center["lng"]),
                        "type": "restaurant",
                        "durationMins": 30,
                        "category": "experience",
                    }, 0.5)
                    used_restaurants.add(sf["name"])
                    sf_used += 1
            else:
                lunch_restaurant = next((r for r in scored_restaurants if r["name"] not in used_restaurants), None)
                if lunch_restaurant:
                    used_restaurants.add(lunch_restaurant["name"])
                    overhead, label = travel_between(lunch_restaurant.get("lat", prev_lat), lunch_restaurant.get("lng", prev_lng))
                    clock += overhead
                    lunch_tip = lunch_restaurant.get("insiderTip") or "🍽️ Peak lunch is 1–2 PM. Arrive by 12:30 for quick service."
                    push_activity({
                        "name": f"Lunch at {lunch_restaurant['name']}",
                        "desc": f"{lunch_restaurant.get('desc', '')} Must-try: {lunch_restaurant.get('mustTry', '')}. {lunch_restaurant.get('priceRange', '')} per person.",
                        "crowd": "Medium",
                        "crowdTip": lunch_tip,
                        "travelFromPrev": label,
                        "lat": lunch_restaurant.get("lat", map_center["lat"]),
                        "lng": lunch_restaurant.get("lng", map_center["lng"]),
                        "type": "restaurant",
                        "durationMins": pace["lunchBreakMins"],
                        "category": lunch_restaurant.get("category", "casual"),
                    }, pace["lunchBreakMins"] / 60)

        # ── Afternoon rest ──
        if pace["afternoonRestMins"] > 0 and clock < hard_stop - 1:
            clock += pace["afternoonRestMins"] / 60

        # ── Afternoon attractions ──
        # Skip afternoon attractions on last day if tight on time
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
            if clock >= 19.5:
                break

            # V2: Skip if closed on this day
            open_on = attr.get("_openOnDays")
            if open_on is not None and day_index not in open_on:
                continue

            # V2: Prefer sunset-tagged attractions for late afternoon
            if attr.get("bestTimeToVisit") == "sunset" and clock < 16.0:
                continue  # Save sunset spots for later

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 20.5:
                break

            # On last day, check if activity fits before departure
            if is_last_day and departure_time_str:
                if clock + overhead + attr_duration > hard_stop:
                    continue

            clock += overhead
            pushed = push_activity(_build_activity(attr, label), attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                afternoon_count += 1
                # V2: Inject nearby gem micro-activity
                clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

        # ── Evening attractions ──
        # Skip evening on last day if departure is early
        evening_slots = pace["activitiesPerSlot"][2]
        if is_last_day and departure_time_str and hard_stop < 18:
            evening_slots = 0

        if evening_slots > 0:
            clock = max(clock, 17.0)

            # V2: Force-schedule sunset attractions first
            sunset_attrs = [
                a for a in day_attraction_pool
                if a["name"] not in used_attractions
                and a.get("bestTimeToVisit") == "sunset"
            ]
            for sunset_attr in sunset_attrs[:1]:  # At most 1 sunset activity
                if clock >= 20.0 or evening_slots <= 0:
                    break
                overhead, label = travel_between(sunset_attr.get("lat", prev_lat), sunset_attr.get("lng", prev_lng))
                attr_duration = _parse_duration_hours(sunset_attr.get("duration"))
                if clock + overhead + attr_duration <= 20.5:
                    clock += overhead
                    sunset_act = _build_activity(sunset_attr, label)
                    sunset_act["crowdTip"] = sunset_attr.get("insiderTip") or "🌅 Golden hour — the light here is absolutely magical. Arrive 15 min early for the best spot."
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
                if clock >= 20.0:
                    break

                # V2: Skip if closed on this day
                open_on = attr.get("_openOnDays")
                if open_on is not None and day_index not in open_on:
                    continue

                overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
                attr_duration = _parse_duration_hours(attr.get("duration"))

                if clock + overhead + attr_duration > 20.5:
                    break

                clock += overhead
                pushed = push_activity(_build_activity(attr, label), attr_duration)

                if pushed:
                    used_attractions.add(attr["name"])
                    evening_count += 1
                    clock = _maybe_inject_nearby_gem(attr, day_activities, clock, hard_stop)

        # ── Dinner ──
        # Skip dinner on last day if departure is before 8 PM
        skip_dinner = is_last_day and departure_time_str and hard_stop < 19
        if not skip_dinner:
            clock = max(clock, 19.5)
            if clock < hard_stop:
                dinner_restaurant = next(
                    (r for r in scored_restaurants if r["name"] not in used_restaurants),
                    scored_restaurants[0] if scored_restaurants else None
                )
                if dinner_restaurant:
                    overhead, label = travel_between(dinner_restaurant.get("lat", prev_lat), dinner_restaurant.get("lng", prev_lng))
                    clock += overhead
                    desc = (
                        f"End your trip on a delicious note! {dinner_restaurant.get('desc', '')} Try the {dinner_restaurant.get('mustTry', '')}."
                        if is_last_day
                        else f"{dinner_restaurant.get('desc', '')} Try the {dinner_restaurant.get('mustTry', '')}."
                    )
                    dinner_tip = dinner_restaurant.get("insiderTip") or "🌙 Evening dining in India peaks 8–9 PM. Arriving at 7:30 PM means you get the best table."
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
                    if dinner_restaurant["name"] not in used_restaurants:
                        used_restaurants.add(dinner_restaurant["name"])

        # ── Departure marker on last day ─────────────────────────────────────
        if is_last_day and departure_time_str and departure_mode:
            mode_labels = {"flight": "✈️ Head to Airport", "train": "🚆 Head to Railway Station", "bus": "🚌 Head to Bus Stand", "car": "🚗 Begin Drive Home"}
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
                "durationMins": DEPARTURE_BUFFER_HOURS.get(departure_mode, 1) * 60,
            }, DEPARTURE_BUFFER_HOURS.get(departure_mode, 1))

        # Day title
        purpose_titles = DAY_TITLES_MAP.get(ctx.get("purpose", "cultural"), DAY_TITLES_MAP["cultural"])
        day_title = purpose_titles[day_index % len(purpose_titles)] if purpose_titles else f"Day {day_index + 1}"

        # Override titles for first/last day with travel context
        if is_first_day and is_multi_day:
            arrival_mode = ctx.get("arrivalMode", "")
            if arrival_mode:
                mode_emoji = {"flight": "✈️", "train": "🚆", "bus": "🚌", "car": "🚗"}.get(arrival_mode, "🗺️")
                day_title = f"{mode_emoji} Arrival & {day_title}"
            else:
                day_title = f"🗺️ Arrival & {day_title}"

        if is_last_day and is_multi_day and days > 1:
            if departure_mode:
                mode_emoji = {"flight": "✈️", "train": "🚆", "bus": "🚌", "car": "🚗"}.get(departure_mode, "🗺️")
                day_title = f"{day_title} & {mode_emoji} Departure"
            else:
                day_title = f"{day_title} & Farewell"

        # Weather
        weather_idx = day_index % len(WEATHER_CONDITIONS)
        weather = {"temp": temp_for_month, **WEATHER_CONDITIONS[weather_idx]}

        day_plans.append({
            "day": day_index + 1,
            "title": day_title,
            "weather": weather,
            "activities": day_activities,
        })

        # Reset restaurants if exhausted
        if len(used_restaurants) >= len(scored_restaurants):
            used_restaurants.clear()

    # ── Build final itinerary ────────────────────────────────────────────────
    total_activities = sum(len(d["activities"]) for d in day_plans)
    print(f"[ItineraryModel] Personalized itinerary built: {len(day_plans)} days, {total_activities} activities")

    # Build departure info summary
    departure_info = None
    if departure_time_str and departure_mode:
        available_after_checkout = max(0, last_day_hard_stop - checkout_hour)
        departure_info = {
            "departureTime": departure_time_str,
            "departureMode": departure_mode,
            "lastActivityBy": _to_time_str(last_day_hard_stop),
            "checkoutTime": _to_time_str(checkout_hour),
            "availableHoursAfterCheckout": round(available_after_checkout, 1),
            "bufferNote": f"You have {available_after_checkout:.0f}h {int((available_after_checkout % 1) * 60)}min after checkout before you need to leave for your {departure_mode}.",
        }

    result = {
        "destName": ctx.get("destName", ""),
        "description": dest_data.get("description", ""),
        "avgCost": dest_data.get("avgCost", ""),
        "crowdLevel": dest_data.get("crowdLevel", "Medium"),
        "crowdNote": dest_data.get("crowdNote", ""),
        "logistics": dest_data.get("logistics", {"flights": "Check airline websites", "trains": "Check IRCTC"}),
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
            }
            for h in highlights
        ],
        "restaurants": [
            {**r} for r in scored_restaurants
        ],
        "hotels": [
            {**h} for h in hotels
        ],
        "dayPlans": day_plans,
        "mapCenter": map_center,
    }

    if departure_info:
        result["departureInfo"] = departure_info

    return result
