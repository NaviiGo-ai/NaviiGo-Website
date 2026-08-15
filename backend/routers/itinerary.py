# ─── Itinerary Router ───────────────────────────────────────────────────────────
# Production-ready flow:
#   1. Check multi-layer cache for destination data (memory → file → CSV → Gemini)
#   2. Run deterministic personalization engine (itinerary_model)
#   3. Optionally save to Firebase if userId is provided
#   4. Return the fully processed itinerary with dayPlans

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from services.destination_cache import get_destination_data
from services.itinerary_model import generate_itinerary
from services.from_link_engine import extract_from_link
from services.user_data import save_itinerary, get_full_user_context, add_past_destination
from services.gemini_cache import cached_gemini_call
from services.firebase_client import verify_firebase_id_token
from limiter import limiter

router = APIRouter()


class ItineraryRequest(BaseModel):
    userId: Optional[str] = None  # Firebase UID — saves itinerary & enriches with user data
    destination: Optional[str] = None
    destName: str
    purpose: str = "cultural"
    group: Optional[str] = "solo"
    days: int = Field(default=3, ge=1, le=14)
    budget: int = Field(default=15000, ge=0)
    startDate: Optional[str] = None
    travelerType: Optional[str] = "comfort"
    preferences: Optional[Dict[str, Any]] = None
    browsingSignals: Optional[Dict[str, Any]] = None
    # ── New: Travel logistics ──
    arrivalTime: Optional[str] = None     # "morning" / "afternoon" / "evening" / "night"
    arrivalMode: Optional[str] = None     # "flight" / "train" / "bus" / "car"
    departureTime: Optional[str] = None   # "08:00" / "10:00" / "14:00" etc.
    departureMode: Optional[str] = None   # "flight" / "train" / "bus" / "car"
    hotelArea: Optional[str] = None       # "old-city" / "city-center" / "beachside" etc.
    originCity: Optional[str] = None      # User's departure city
    mustDo: Optional[List[Dict[str, Any]]] = None  # Pinned activities
    routeStops: List["RouteStop"] = Field(default_factory=list)


class RouteStop(BaseModel):
    """A city visited after the primary destination in a multi-city route."""
    name: str = Field(min_length=1, max_length=100)
    stayDays: int = Field(default=1, ge=1, le=14)
    travelMode: str = "train"
    travelTime: str = "morning"


class FromLinkRequest(BaseModel):
    url: Optional[str] = None
    captionText: Optional[str] = None


@router.post("/generate")
@limiter.limit("5/minute")
async def generate(payload: ItineraryRequest, request: Request):
    try:
        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Sign in is required to create an itinerary")

        try:
            token_claims = verify_firebase_id_token(authorization.removeprefix("Bearer ").strip())
            authenticated_user_id = token_claims.get("uid")
        except Exception as auth_error:
            print(f"[Itinerary] Firebase token verification failed: {auth_error}")
            raise HTTPException(status_code=401, detail="Your sign-in session is invalid or expired. Please sign in again.")

        if not authenticated_user_id:
            raise HTTPException(status_code=401, detail="Your sign-in session does not include a user identity.")

        if not payload.destName or not payload.purpose or not payload.days:
            raise HTTPException(status_code=400, detail="Missing required fields: destName, purpose, days")

        resolved_dest = payload.destination or payload.destName.lower().replace(" ", "")
        dest_name = payload.destName

        # Enrich with Firebase user data for the verified user. Never trust payload.userId.
        preferences = payload.preferences
        browsing_signals = payload.browsingSignals
        traveler_type = payload.travelerType or "comfort"
        group = payload.group or "solo"

        if authenticated_user_id:
            user_ctx = await get_full_user_context(authenticated_user_id)
            if not preferences and user_ctx.get("interests"):
                preferences = {"interests": user_ctx["interests"]}
            if not browsing_signals and user_ctx.get("browsingSignals"):
                browsing_signals = user_ctx["browsingSignals"]
            if user_ctx.get("travelStyle"):
                traveler_type = user_ctx["travelStyle"]
            if user_ctx.get("preferredGroup"):
                group = user_ctx["preferredGroup"]

        # Build user context (used by the deterministic engine)
        user_context = {
            "destination": resolved_dest,
            "destName": dest_name,
            "purpose": payload.purpose,
            "group": group,
            "days": payload.days or 3,
            "budget": payload.budget or 15000,
            "startDate": payload.startDate or datetime.now().strftime("%Y-%m-%d"),
            "travelerType": traveler_type,
            "preferences": preferences,
            "pastTrips": [],
            "browsingSignals": browsing_signals,
            # ── New: Travel logistics ──
            "arrivalTime": payload.arrivalTime or "afternoon",
            "arrivalMode": payload.arrivalMode or "",
            "departureTime": payload.departureTime or "",
            "departureMode": payload.departureMode or "",
            "hotelArea": payload.hotelArea or "",
            "originCity": payload.originCity or "",
            "mustDo": payload.mustDo or [],
        }

        route_stops = [stop for stop in payload.routeStops if stop.name.strip().lower() != dest_name.strip().lower()]
        if route_stops:
            result = await _generate_multi_city_itinerary(user_context, route_stops)
            if result:
                await save_itinerary(authenticated_user_id, {
                    "destination": resolved_dest,
                    "destName": result["destName"],
                    "form": {
                        "purpose": payload.purpose,
                        "group": group,
                        "days": payload.days,
                        "budget": payload.budget,
                        "startDate": payload.startDate,
                        "travelerType": traveler_type,
                        "routeStops": [stop.model_dump() for stop in route_stops],
                    },
                    "generatedData": result,
                })
                return {
                    "success": True,
                    "itinerary": result,
                    "source": "multi-city-personalized",
                    "userId": authenticated_user_id,
                }

        # ── Step 1: Get destination data from cache (memory → file → CSV → Gemini) ──
        print(f"[Itinerary] Fetching data for \"{dest_name}\" (cache-first)...")
        gemini_data = await get_destination_data(
            dest_name=dest_name,
            purpose=payload.purpose,
            budget=payload.budget or 15000,
            days=payload.days or 3,
        )

        if gemini_data:
            # ── Step 2: Run deterministic personalization engine ──
            print(f"[Itinerary] Got destination data, running personalization...")
            result = generate_itinerary(user_context, gemini_data)
            if result:
                # ── Step 3: Save to Firebase if userId provided ──
                if authenticated_user_id:
                    await save_itinerary(authenticated_user_id, {
                        "destination": resolved_dest,
                        "destName": dest_name,
                        "form": {
                            "purpose": payload.purpose,
                            "group": group,
                            "days": payload.days,
                            "budget": payload.budget,
                            "startDate": payload.startDate,
                            "travelerType": traveler_type,
                            "routeStops": [stop.model_dump() for stop in route_stops],
                        },
                        "generatedData": result,
                    })

                return {
                    "success": True,
                    "itinerary": result,
                    "source": "ai-personalized",
                    "userId": authenticated_user_id,
                }

        # ── Fallback: minimal data + deterministic engine ──
        print(f"[Itinerary] Data fetch failed for \"{dest_name}\", using minimal fallback")
        try:
            fallback_data = _build_minimal_dest_info(dest_name)
            fallback_result = generate_itinerary(user_context, fallback_data)
            if fallback_result:
                # Still save to Firebase
                if authenticated_user_id:
                    await save_itinerary(authenticated_user_id, {
                        "destination": resolved_dest,
                        "destName": dest_name,
                        "form": {"purpose": payload.purpose, "group": group, "days": payload.days},
                        "generatedData": fallback_result,
                    })
                return {
                    "success": True,
                    "itinerary": fallback_result,
                    "source": "fallback-personalized",
                    "userId": authenticated_user_id,
                }
        except Exception as fallback_err:
            print(f"[Itinerary] Fallback engine also failed: {fallback_err}")

        # Last resort
        return {
            "success": True,
            "itinerary": {
                "destName": dest_name,
                "description": f"{dest_name} is a wonderful destination. Plan your trip with NaviiGo!",
                "avgCost": "₹2,000 – ₹8,000",
                "crowdLevel": "Medium",
                "crowdNote": "Check seasonal crowd levels",
                "logistics": {"flights": "Check airline websites", "trains": "Check IRCTC"},
                "mapCenter": {"lat": 20.5937, "lng": 78.9629},
                "highlights": [],
                "restaurants": [],
                "hotels": [],
                "dayPlans": [],
            },
            "source": "empty-fallback",
            "userId": authenticated_user_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Itinerary] Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/from-link")
@limiter.limit("10/minute")
async def from_link(payload: FromLinkRequest, request: Request):
    try:
        extracted = await extract_from_link(url=payload.url, caption_text=payload.captionText)
        return {"success": True, "extracted": extracted}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_minimal_dest_info(dest_name: str) -> dict:
    """Build minimal destination data when all sources are unavailable."""
    return {
        "description": f"{dest_name} is a vibrant destination in India with rich culture, stunning landscapes, and unforgettable experiences.",
        "avgCost": "₹2,000 – ₹8,000 per day",
        "crowdLevel": "Medium",
        "crowdNote": "Varies by season — check local advisories",
        "logistics": {"flights": "Check airline websites for latest fares", "trains": "Check IRCTC for trains"},
        "weather": {},
        "mapCenter": {"lat": 20.5937, "lng": 78.9629},
        "highlights": [
            {"name": f"{dest_name} Heritage Walk", "desc": "Explore the historic old quarter and local markets.", "tags": ["Heritage", "Culture"], "lat": 20.60, "lng": 78.97, "duration": "2-3 hrs", "img": "", "bestMonths": "Oct-Mar"},
            {"name": "Local Morning Market", "desc": "Wake up early and visit where locals shop.", "tags": ["Market", "Food"], "lat": 20.59, "lng": 78.96, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "Sunset Viewpoint", "desc": "The best sunset spot in the city.", "tags": ["Nature", "Sunset"], "lat": 20.58, "lng": 78.95, "duration": "1 hr", "img": "", "bestMonths": "Oct-Mar"},
            {"name": f"{dest_name} Temple", "desc": "The most iconic spiritual site.", "tags": ["Temple", "Spiritual"], "lat": 20.61, "lng": 78.98, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "Museum & Art Gallery", "desc": "A curated collection of local art and history.", "tags": ["Museum", "Culture"], "lat": 20.595, "lng": 78.965, "duration": "1-2 hrs", "img": "", "bestMonths": "All year"},
            {"name": "City Park & Gardens", "desc": "A peaceful green escape.", "tags": ["Nature", "Relaxation"], "lat": 20.585, "lng": 78.955, "duration": "1 hr", "img": "", "bestMonths": "Oct-Mar"},
        ],
        "restaurants": [
            {"name": "Local Thali House", "desc": "Authentic regional thali.", "cuisine": "Regional", "priceRange": "₹200-400", "rating": 4.5, "mustTry": "Traditional thali", "lat": 20.595, "lng": 78.965, "tags": ["Local"], "id": "r1", "img": ""},
            {"name": "Street Food Corner", "desc": "Popular chaat and snacks.", "cuisine": "Street Food", "priceRange": "₹50-150", "rating": 4.3, "mustTry": "Local chaat", "lat": 20.59, "lng": 78.96, "tags": ["Street Food"], "id": "r2", "img": ""},
            {"name": "Rooftop Café", "desc": "Great views with coffee.", "cuisine": "Café", "priceRange": "₹300-600", "rating": 4.4, "mustTry": "Filter coffee", "lat": 20.60, "lng": 78.97, "tags": ["Café"], "id": "r3", "img": ""},
            {"name": "Heritage Restaurant", "desc": "Fine dining in a heritage building.", "cuisine": "Indian", "priceRange": "₹500-1200", "rating": 4.6, "mustTry": "Biryani", "lat": 20.605, "lng": 78.975, "tags": ["Fine Dining"], "id": "r4", "img": ""},
        ],
        "hotels": [
            {"name": "Budget Hostel", "desc": "Clean and wallet-friendly.", "type": "Hostel", "priceRange": "₹500-800/night", "rating": 4.2, "amenities": ["WiFi", "AC"], "lat": 20.59, "lng": 78.96, "id": "h1", "img": ""},
            {"name": "Comfort Inn", "desc": "Reliable mid-range option.", "type": "Hotel", "priceRange": "₹1500-3000/night", "rating": 4.4, "amenities": ["WiFi", "AC", "Restaurant"], "lat": 20.595, "lng": 78.965, "id": "h2", "img": ""},
            {"name": "Heritage Resort", "desc": "Premium heritage property.", "type": "Resort", "priceRange": "₹5000-12000/night", "rating": 4.7, "amenities": ["WiFi", "AC", "Pool", "Spa"], "lat": 20.60, "lng": 78.97, "id": "h3", "img": ""},
        ],
    }


async def _generate_multi_city_itinerary(base_context: Dict[str, Any], route_stops: List[RouteStop]) -> Optional[dict]:
    """Generate city plans and explicit transit days for an ordered route.

    ``days`` is the full trip length. Every city-to-city leg reserves one whole
    day so we never hide a long transfer inside an attraction-heavy schedule.
    """
    primary_days = base_context["days"] - len(route_stops) - sum(stop.stayDays for stop in route_stops)
    if primary_days < 1:
        required_days = len(route_stops) + sum(stop.stayDays for stop in route_stops) + 1
        raise HTTPException(
            status_code=400,
            detail=f"This route needs at least {required_days} days: one stay day per city plus one transit day per transfer.",
        )

    city_specs = [(base_context["destName"], primary_days, None)]
    city_specs.extend((stop.name.strip(), stop.stayDays, stop.travelMode) for stop in route_stops)
    city_results: List[dict] = []

    for city_index, (city_name, stay_days, incoming_mode) in enumerate(city_specs):
        city_data = await get_destination_data(
            dest_name=city_name,
            purpose=base_context["purpose"],
            budget=base_context["budget"],
            days=stay_days,
        ) or _build_minimal_dest_info(city_name)

        is_first_city = city_index == 0
        is_last_city = city_index == len(city_specs) - 1
        city_context = {
            **base_context,
            "destination": city_name.lower().replace(" ", "-"),
            "destName": city_name,
            "days": stay_days,
            "arrivalTime": base_context["arrivalTime"] if is_first_city else "afternoon",
            "arrivalMode": base_context["arrivalMode"] if is_first_city else incoming_mode or "",
            "departureTime": base_context["departureTime"] if is_last_city else "",
            "departureMode": base_context["departureMode"] if is_last_city else "",
            "originCity": base_context["originCity"] if is_first_city else city_specs[city_index - 1][0],
            # Pins apply to the trip's primary city. Applying them to every city
            # would create incorrect duplicate activities.
            "mustDo": base_context["mustDo"] if is_first_city else [],
        }
        city_result = generate_itinerary(city_context, city_data)
        if not city_result:
            return None
        for plan in city_result.get("dayPlans", []):
            plan["title"] = f"{city_name} — {plan['title']}"
        city_results.append(city_result)

    combined_plans: List[dict] = []
    for index, city_result in enumerate(city_results):
        combined_plans.extend(city_result.get("dayPlans", []))
        if index < len(route_stops):
            next_result = city_results[index + 1]
            stop = route_stops[index]
            combined_plans.append(_build_transit_day(
                from_city=city_specs[index][0],
                to_city=city_specs[index + 1][0],
                mode=stop.travelMode,
                travel_time=stop.travelTime,
                from_hotel=(city_result.get("hotels") or [{}])[0],
                to_hotel=(next_result.get("hotels") or [{}])[0],
                from_center=city_result.get("mapCenter") or {"lat": 20.5937, "lng": 78.9629},
                to_center=next_result.get("mapCenter") or {"lat": 20.5937, "lng": 78.9629},
            ))

    for day_number, plan in enumerate(combined_plans, start=1):
        plan["day"] = day_number

    route_names = [spec[0] for spec in city_specs]
    first_result = city_results[0]
    last_result = city_results[-1]
    return {
        **first_result,
        "destName": " → ".join(route_names),
        "description": f"A {len(route_names)}-city route through {' → '.join(route_names)}, with travel days protected from sightseeing overload.",
        "highlights": [item for city in city_results for item in city.get("highlights", [])],
        "restaurants": [item for city in city_results for item in city.get("restaurants", [])],
        "hotels": [item for city in city_results for item in city.get("hotels", [])],
        "dayPlans": combined_plans,
        "routeStops": [
            {"name": city_specs[0][0], "stayDays": primary_days, "travelMode": None},
            *[stop.model_dump() for stop in route_stops],
        ],
        "departureInfo": last_result.get("departureInfo"),
    }


def _build_transit_day(
    from_city: str,
    to_city: str,
    mode: str,
    travel_time: str,
    from_hotel: dict,
    to_hotel: dict,
    from_center: dict,
    to_center: dict,
) -> dict:
    mode_details = {
        "flight": ("✈️", "airport", 4),
        "train": ("🚆", "railway station", 6),
        "bus": ("🚌", "bus terminal", 7),
        "car": ("🚗", "departure point", 5),
    }
    emoji, terminal, estimated_hours = mode_details.get(mode, ("🧳", "departure point", 6))
    from_hotel_name = from_hotel.get("name", "your hotel")
    to_hotel_name = to_hotel.get("name", "your stay")
    from_lat, from_lng = from_hotel.get("lat", from_center.get("lat")), from_hotel.get("lng", from_center.get("lng"))
    to_lat, to_lng = to_hotel.get("lat", to_center.get("lat")), to_hotel.get("lng", to_center.get("lng"))
    departure_times = {"morning": "08:00 AM", "afternoon": "12:00 PM", "evening": "04:00 PM", "night": "08:00 PM"}
    travel_start = departure_times.get(travel_time, "08:00 AM")
    return {
        "day": 0,
        "title": f"{emoji} Transit Day: {from_city} → {to_city}",
        "isTransitDay": True,
        "weather": {
            "temp": "Travel day",
            "condition": f"{mode.title()} transfer",
            "emoji": emoji,
            "rain": 0,
            "tip": "Keep IDs, tickets, chargers, water, and a light snack within reach.",
        },
        "activities": [
            {
                "time": travel_start,
                "slot": "Morning",
                "name": f"Checkout from {from_hotel_name}",
                "desc": f"Pack up and confirm your {mode} tickets for {to_city}.",
                "crowd": "Low",
                "crowdTip": "Ask reception to arrange luggage storage if you have extra time.",
                "lat": from_lat,
                "lng": from_lng,
                "type": "hotel",
            },
            {
                "time": "Before departure",
                "slot": "Morning",
                "name": f"Travel to the {terminal}",
                "desc": f"Leave with a buffer for traffic, check-in, and platform or gate changes.",
                "crowd": "Medium",
                "crowdTip": "Aim to arrive early, especially during weekends and holidays.",
                "travelFromPrev": "30–60 min buffer",
                "lat": from_center.get("lat"),
                "lng": from_center.get("lng"),
                "type": "transit",
            },
            {
                "time": "Travel window",
                "slot": "Afternoon",
                "name": f"{mode.title()} to {to_city}",
                "desc": f"Protected travel window — allow about {estimated_hours} hours door to door before making other plans.",
                "crowd": "Medium",
                "crowdTip": "Keep booking confirmations and a power bank accessible.",
                "travelFromPrev": "Boarding / check-in",
                "lat": to_center.get("lat"),
                "lng": to_center.get("lng"),
                "type": "transit",
            },
            {
                "time": "06:00 PM",
                "slot": "Evening",
                "name": f"Check in at {to_hotel_name}",
                "desc": f"Settle into {to_city}, recharge, and keep the evening flexible after your journey.",
                "crowd": "Low",
                "crowdTip": "Confirm tomorrow's first activity and any local transport at check-in.",
                "travelFromPrev": "Arrival transfer",
                "lat": to_lat,
                "lng": to_lng,
                "type": "hotel",
            },
        ],
    }
