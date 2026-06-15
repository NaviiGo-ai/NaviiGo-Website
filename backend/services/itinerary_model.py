# ─── Deterministic Itinerary Personalization Engine ─────────────────────────────
# Faithfully ported from lib/ai/itineraryModel.ts (792 lines).
# Scoring-based itinerary generation using user signals — wizard inputs,
# browsing analytics, preferences, and past trip history.

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
    {"condition": "Misty Morning", "emoji": "🌫️", "rain": 30, "tip": "Carry a light jacket and umbrella"},
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


# ─── Scoring Engine ──────────────────────────────────────────────────────────

def _score_attraction(attr: dict, index: int, ctx: dict, budget_tier: str) -> dict:
    score = 50
    tags = attr.get("tags", [])

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

    return {**attr, "score": score, "originalIndex": index}


# ─── Main Generation Function ───────────────────────────────────────────────

def generate_itinerary(ctx: dict, dest_data: dict) -> Optional[dict]:
    """
    Generate a fully personalized itinerary with day plans, scored attractions,
    restaurants, hotels — identical to the TypeScript itineraryModel output.
    """
    if not dest_data:
        return None

    days = ctx.get("days", 3)
    budget = ctx.get("budget", 15000)
    budget_per_day = budget / max(days, 1)
    budget_tier = "luxury" if budget_per_day > 12000 else ("mid-range" if budget_per_day > 5000 else "budget")

    map_center = dest_data.get("mapCenter", {"lat": 20.5937, "lng": 78.9629})

    # Score all attractions
    highlights = dest_data.get("highlights", [])
    scored_attractions = [_score_attraction(a, i, ctx, budget_tier) for i, a in enumerate(highlights)]
    scored_attractions.sort(key=lambda a: a["score"], reverse=True)
    scored_attractions = _geo_filter_and_snap(scored_attractions, map_center)

    # Score restaurants
    restaurants = list(dest_data.get("restaurants", []))
    restaurants.sort(key=lambda r: r.get("rating", 0) * 10, reverse=True)
    scored_restaurants = _geo_filter_and_snap(restaurants, map_center)

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

    # ── Build Day Plans ──────────────────────────────────────────────────────
    pace = TRAVELER_PACE.get(ctx.get("travelerType", "comfort"), TRAVELER_PACE["comfort"])
    day_plans = []
    used_attractions = set()
    used_restaurants = set()
    is_arrival_day_light = days > 2

    for day_index in range(days):
        day_activities = []
        is_first_day = day_index == 0
        is_last_day = day_index == days - 1

        clock = 13.0 if (is_first_day and is_arrival_day_light) else (pace["wakeHour"] + 0.5)
        day_end_hour = 21.0
        max_end = pace["wakeHour"] + 0.5 + pace["maxActiveHours"]
        hard_stop = min(day_end_hour, max_end)

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

        # ── Morning: early temple slot ──
        morning_slots = 0 if (is_first_day and is_arrival_day_light) else pace["activitiesPerSlot"][0]

        if not is_first_day and pace["templeEarlyMorning"] and ctx.get("purpose") in ("spiritual", "cultural"):
            temple_attr = next(
                (a for a in scored_attractions if a["name"] not in used_attractions and
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
        for attr in scored_attractions:
            if morning_count >= morning_slots:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 15.5:
                break

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 16.0:
                break

            clock += overhead
            pushed = push_activity({
                "name": attr["name"],
                "desc": attr.get("desc", ""),
                "crowd": "Low" if attr.get("walking") == "Easy" else "Medium",
                "crowdTip": _get_survey_tip(attr.get("tags", [])),
                "travelFromPrev": label,
                "lat": attr.get("lat", map_center["lat"]),
                "lng": attr.get("lng", map_center["lng"]),
                "type": "attraction",
                "durationMins": _parse_duration_hours(attr.get("duration")) * 60,
            }, attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                morning_count += 1

        # ── Lunch ──
        clock = max(clock, 13.5)
        lunch_restaurant = next((r for r in scored_restaurants if r["name"] not in used_restaurants), None)
        if lunch_restaurant:
            used_restaurants.add(lunch_restaurant["name"])
            overhead, label = travel_between(lunch_restaurant.get("lat", prev_lat), lunch_restaurant.get("lng", prev_lng))
            clock += overhead
            push_activity({
                "name": f"Lunch at {lunch_restaurant['name']}",
                "desc": f"{lunch_restaurant.get('desc', '')} Must-try: {lunch_restaurant.get('mustTry', '')}. {lunch_restaurant.get('priceRange', '')} per person.",
                "crowd": "Medium",
                "crowdTip": "🍽️ Survey says: peak lunch is 1–2 PM. Arrive by 12:30 for same-day service without a wait.",
                "travelFromPrev": label,
                "lat": lunch_restaurant.get("lat", map_center["lat"]),
                "lng": lunch_restaurant.get("lng", map_center["lng"]),
                "type": "restaurant",
                "durationMins": pace["lunchBreakMins"],
            }, pace["lunchBreakMins"] / 60)

        # ── Afternoon rest ──
        if pace["afternoonRestMins"] > 0:
            clock += pace["afternoonRestMins"] / 60

        # ── Afternoon attractions ──
        afternoon_count = 0
        for attr in scored_attractions:
            if afternoon_count >= pace["activitiesPerSlot"][1]:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 19.5:
                break

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = min(2.5, _parse_duration_hours(attr.get("duration")))

            if clock + overhead + attr_duration > 20.5:
                break

            clock += overhead
            pushed = push_activity({
                "name": attr["name"],
                "desc": attr.get("desc", ""),
                "crowd": "Medium",
                "crowdTip": _get_survey_tip(attr.get("tags", [])),
                "travelFromPrev": label,
                "lat": attr.get("lat", map_center["lat"]),
                "lng": attr.get("lng", map_center["lng"]),
                "type": "attraction",
                "durationMins": _parse_duration_hours(attr.get("duration")) * 60,
            }, attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                afternoon_count += 1

        # ── Evening attractions ──
        clock = max(clock, 17.0)
        evening_count = 0
        for attr in scored_attractions:
            if evening_count >= pace["activitiesPerSlot"][2]:
                break
            if attr["name"] in used_attractions:
                continue
            if clock >= 20.0:
                break

            overhead, label = travel_between(attr.get("lat", prev_lat), attr.get("lng", prev_lng))
            attr_duration = _parse_duration_hours(attr.get("duration"))

            if clock + overhead + attr_duration > 20.5:
                break

            clock += overhead
            pushed = push_activity({
                "name": attr["name"],
                "desc": attr.get("desc", ""),
                "crowd": "Medium",
                "crowdTip": "🌅 Golden hour — best light for photos and the most magical atmosphere",
                "travelFromPrev": label,
                "lat": attr.get("lat", map_center["lat"]),
                "lng": attr.get("lng", map_center["lng"]),
                "type": "attraction",
                "durationMins": _parse_duration_hours(attr.get("duration")) * 60,
            }, attr_duration)

            if pushed:
                used_attractions.add(attr["name"])
                evening_count += 1

        # ── Dinner ──
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
                push_activity({
                    "name": f"Dinner at {dinner_restaurant['name']}",
                    "desc": desc,
                    "crowd": "Low",
                    "crowdTip": "🌙 Evening dining in India peaks 8–9 PM. Arriving at 7:30 PM means you get the best table.",
                    "travelFromPrev": label,
                    "lat": dinner_restaurant.get("lat", map_center["lat"]),
                    "lng": dinner_restaurant.get("lng", map_center["lng"]),
                    "type": "restaurant",
                    "durationMins": 75,
                }, 1.25)
                if dinner_restaurant["name"] not in used_restaurants:
                    used_restaurants.add(dinner_restaurant["name"])

        # Day title
        purpose_titles = DAY_TITLES_MAP.get(ctx.get("purpose", "cultural"), DAY_TITLES_MAP["cultural"])
        day_title = purpose_titles[day_index % len(purpose_titles)] if purpose_titles else f"Day {day_index + 1}"

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

    return {
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
