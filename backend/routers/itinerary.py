# ─── Itinerary Router ───────────────────────────────────────────────────────────
# Production-ready flow:
#   1. Check multi-layer cache for destination data (memory → file → CSV → Gemini)
#   2. Run deterministic personalization engine (itinerary_model)
#   3. Optionally save to Firebase if userId is provided
#   4. Return the fully processed itinerary with dayPlans

import asyncio
import copy
import hashlib
import inspect
import json
import re
import uuid as uuid_lib

from fastapi import APIRouter, HTTPException, Request
from firebase_admin import firestore
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from services.destination_cache import get_destination_data
from services.itinerary_model import generate_itinerary
from services.from_link_engine import extract_from_link
from services.user_data import get_full_user_context, save_itinerary
from services.gemini_cache import cached_gemini_call
from services.firebase_client import get_db
from services.replan_engine import (
    ActivityIdentityAmbiguousError,
    ReplanValidationError,
    generate_replan_proposal,
)
from app.core.dependencies import CurrentUserId
from app.core.errors import AppError
from limiter import limiter

router = APIRouter()


def _phase6_error(code: str, status_code: int, message: str, details: Optional[dict] = None) -> AppError:
    """Create a stable machine-readable error for the Phase 6 boundary."""
    return AppError(message, code=code, status_code=status_code, details=details)


async def _firestore_call(callable_obj, *args, **kwargs):
    """Run the synchronous Admin SDK without blocking the event loop.

    The small awaitable check keeps this seam usable with async fakes in route
    tests while production continues to use the synchronous Firebase Admin SDK.
    """
    result = await asyncio.to_thread(callable_obj, *args, **kwargs)
    if inspect.isawaitable(result):
        return await result
    return result


def _doc_data(document) -> Optional[dict]:
    if not document or not getattr(document, "exists", False):
        return None
    value = document.to_dict()
    return value if isinstance(value, dict) else None


def _supplied_fields(model: BaseModel) -> set[str]:
    fields = getattr(model, "model_fields_set", None)
    if fields is not None:
        return set(fields)
    return set(getattr(model, "__fields_set__", set()))


def _operation_id(
    body_operation_id: Optional[str],
    header_operation_id: Optional[str],
    legacy_operation_id: Optional[str] = None,
) -> str:
    """Resolve and validate an operation identity without guessing it."""
    body_value = body_operation_id.strip() if isinstance(body_operation_id, str) else None
    header_value = header_operation_id.strip() if isinstance(header_operation_id, str) else None
    legacy_value = legacy_operation_id.strip() if isinstance(legacy_operation_id, str) else None

    if body_value and legacy_value and body_value != legacy_value:
        raise _phase6_error("VALIDATION_ERROR", 422, "operationId and legacy uuid must match.")
    if body_value and header_value and body_value != header_value:
        raise _phase6_error("VALIDATION_ERROR", 422, "operationId and Idempotency-Key must match.")

    resolved = body_value or header_value or legacy_value
    if not resolved:
        raise _phase6_error("VALIDATION_ERROR", 422, "operationId or Idempotency-Key is required.")

    try:
        parsed = uuid_lib.UUID(resolved)
    except (ValueError, AttributeError):
        raise _phase6_error("VALIDATION_ERROR", 422, "operationId must be a UUID v4.")
    if parsed.version != 4:
        raise _phase6_error("VALIDATION_ERROR", 422, "operationId must be a UUID v4.")
    return str(parsed)


def _request_form(payload: BaseModel) -> dict:
    """Keep exactly the caller-supplied fields for the durable form record."""
    form = payload.model_dump(exclude_unset=True)
    form.pop("operationId", None)
    form.pop("uuid", None)
    return form


def _fingerprint(value: dict) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _owner_itinerary_ref(db, uid: str, itinerary_id: str):
    return db.collection("users").document(uid).collection("itineraries").document(itinerary_id)


def _authoritative_itinerary(owner_data: dict, uid: str, itinerary_id: str) -> dict:
    generated = copy.deepcopy(owner_data.get("generatedData") or owner_data.get("itinerary") or {})
    if not isinstance(generated, dict):
        generated = {}
    generated.setdefault("id", itinerary_id)
    generated.setdefault("itineraryId", itinerary_id)
    generated.setdefault("userId", uid)
    generated.setdefault("ownerUid", uid)
    if owner_data.get("revisionId"):
        generated["revisionId"] = owner_data["revisionId"]
    return generated


def _ensure_activity_identity(itinerary: dict) -> dict:
    """Assign opaque occurrence IDs at the generation boundary.

    ``id`` is retained as a compatibility alias for the existing replan
    engine; ``activityId`` is the Phase 6 authority. Neither value is derived
    from a title, provider ID, day, or array position.
    """
    normalized = copy.deepcopy(itinerary)
    seen_ids: set[str] = set()
    for plan in normalized.get("dayPlans", []):
        if isinstance(plan, dict) and "dayNumber" not in plan and "day" in plan:
            plan["dayNumber"] = plan["day"]
        for activity in (plan.get("activities", []) if isinstance(plan, dict) else []):
            if not isinstance(activity, dict):
                continue
            activity_id = activity.get("activityId")
            if isinstance(activity_id, str):
                activity_id = activity_id.strip()
            if not isinstance(activity_id, str) or not activity_id or activity_id in seen_ids:
                activity_id = str(uuid_lib.uuid4())
            seen_ids.add(activity_id)
            activity["activityId"] = activity_id
            activity["id"] = activity_id
    return normalized


def _replay_or_conflict(existing_data: dict, caller_form: dict, uid: str, operation_id: str) -> Optional[dict]:
    """Classify a pre-existing owner document before expensive generation.

    The persistence service fingerprints the full save envelope, which includes
    generated data.  The route therefore compares the explicit caller form for
    the fast replay path; this avoids regenerating random activity identities on
    a retry while still rejecting a different request under the same operation.
    """
    stored_form = existing_data.get("form")
    stored_input = stored_form.get("input") if isinstance(stored_form, dict) else None
    if not isinstance(stored_input, dict):
        raise _phase6_error(
            "IDEMPOTENCY_CONFLICT",
            409,
            "operationId belongs to an existing itinerary whose request cannot be reconciled safely.",
        )
    if _fingerprint(stored_input) != _fingerprint(caller_form):
        raise _phase6_error(
            "IDEMPOTENCY_CONFLICT",
            409,
            "operationId was already used for a different generation request.",
        )
    # SetupWizard creates a private owner handoff before the expensive backend
    # generation. A matching empty draft is not a durable replay: let the
    # generation path promote it atomically after it has real generated data.
    if (
        existing_data.get("generatedData") is None
        and not existing_data.get("requestFingerprint")
        and not existing_data.get("fingerprint")
        and not existing_data.get("receipt")
    ):
        return None
    stored_receipt = existing_data.get("receipt")
    if not isinstance(stored_receipt, dict) or stored_receipt.get("status") != "committed":
        raise _phase6_error(
            "IDEMPOTENCY_CONFLICT",
            409,
            "The saved itinerary has no acknowledged generation receipt.",
        )
    # The owner path and verified UID are authoritative; in-document identity
    # fields cannot override them. Preserve only the acknowledged revision.
    receipt = {
        "operationId": operation_id,
        "itineraryId": operation_id,
        "ownerUid": uid,
        "revisionId": stored_receipt.get("revisionId") or existing_data.get("revisionId", "rev_0"),
        "status": "committed",
    }
    return {
        "success": True,
        "userId": uid,
        "itinerary": _authoritative_itinerary(existing_data, uid, operation_id),
        "persistence": {"status": "saved", "durable": True, "replayed": True},
        "receipt": receipt,
        "source": existing_data.get("source", "ai-personalized"),
        **({"dataSources": existing_data["dataSources"]} if existing_data.get("dataSources") else {}),
    }


class ItineraryRequest(BaseModel):
    userId: Optional[str] = None  # Firebase UID — saves itinerary & enriches with user data
    operationId: Optional[str] = None
    # ``uuid`` was the pre-Phase-6 client name for the durable itinerary ID.
    # It remains a compatibility read only when operationId is absent.
    uuid: Optional[str] = None
    destination: Optional[str] = None
    destName: str = Field(min_length=1)
    purpose: str = Field(default="cultural", min_length=1)
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
async def generate(payload: ItineraryRequest, request: Request, authenticated_user_id: CurrentUserId):
    operation_id = _operation_id(
        payload.operationId,
        request.headers.get("Idempotency-Key"),
        payload.uuid,
    )
    caller_form = _request_form(payload)

    db = get_db()
    if db is None:
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "Itinerary persistence is unavailable.")

    itinerary_ref = _owner_itinerary_ref(db, authenticated_user_id, operation_id)
    existing_data = _doc_data(await _firestore_call(itinerary_ref.get))
    if existing_data is not None:
        replay = _replay_or_conflict(existing_data, caller_form, authenticated_user_id, operation_id)
        if replay is not None:
            return replay

    supplied = _supplied_fields(payload)
    resolved_dest = (
        payload.destination
        if "destination" in supplied and payload.destination is not None
        else payload.destName.lower().replace(" ", "")
    )
    dest_name = payload.destName

    # Enrich only omitted fields. Explicit empty maps/lists, false values, zero,
    # and null optionals are caller input and must not be replaced by profile data.
    preferences = payload.preferences if "preferences" in supplied else None
    browsing_signals = payload.browsingSignals if "browsingSignals" in supplied else None
    traveler_type = payload.travelerType if "travelerType" in supplied else "comfort"
    raw_group = payload.group if "group" in supplied else "solo"

    purpose_alias_map = {
        "heritage": "cultural",
        "culinary": "cultural",
        "sacred": "spiritual",
        "mountains": "adventure",
        "wildlife": "adventure",
        "slow": "leisure",
        "nightlife": "celebrate",
    }
    resolved_purpose = purpose_alias_map.get(payload.purpose, payload.purpose)

    user_ctx = await get_full_user_context(authenticated_user_id)
    if "preferences" not in supplied and user_ctx.get("interests"):
        preferences = {"interests": user_ctx["interests"]}
    if "browsingSignals" not in supplied and user_ctx.get("browsingSignals"):
        browsing_signals = user_ctx["browsingSignals"]
    if "travelerType" not in supplied and user_ctx.get("travelStyle"):
        traveler_type = user_ctx["travelStyle"]
    if "group" not in supplied and user_ctx.get("preferredGroup"):
        raw_group = user_ctx["preferredGroup"]

    group = (
        "couple" if raw_group in ("duo", "couple")
        else "large" if raw_group in ("caravan", "large")
        else raw_group
    )
    days = payload.days if "days" in supplied else 3
    budget = payload.budget if "budget" in supplied else 15000
    start_date = payload.startDate if "startDate" in supplied else datetime.now().strftime("%Y-%m-%d")
    arrival_time = payload.arrivalTime if "arrivalTime" in supplied else "afternoon"
    arrival_mode = payload.arrivalMode if "arrivalMode" in supplied else ""
    departure_time = payload.departureTime if "departureTime" in supplied else ""
    departure_mode = payload.departureMode if "departureMode" in supplied else ""
    hotel_area = payload.hotelArea if "hotelArea" in supplied else ""
    origin_city = payload.originCity if "originCity" in supplied else ""
    must_do = payload.mustDo if "mustDo" in supplied else []

    user_context = {
        "destination": resolved_dest,
        "destName": dest_name,
        "purpose": resolved_purpose,
        "group": group,
        "days": days,
        "budget": budget,
        "startDate": start_date,
        "travelerType": traveler_type,
        "preferences": preferences,
        "pastTrips": [],
        "browsingSignals": browsing_signals,
        "arrivalTime": arrival_time,
        "arrivalMode": arrival_mode,
        "departureTime": departure_time,
        "departureMode": departure_mode,
        "hotelArea": hotel_area,
        "originCity": origin_city,
        "mustDo": must_do,
    }

    route_stops = [
        stop for stop in payload.routeStops
        if stop.name.strip().lower() != dest_name.strip().lower()
    ]
    source = "ai-personalized"
    data_sources_provenance = None
    result = None

    if route_stops:
        result = await _generate_multi_city_itinerary(user_context, route_stops)
        source = "multi-city-personalized"

    if result is None:
        print(f"[Itinerary] Fetching data for \"{dest_name}\" (cache-first)...")
        gemini_data = await get_destination_data(
            dest_name=dest_name,
            purpose=payload.purpose,
            budget=budget,
            days=days,
        )
        if not gemini_data:
            raise _phase6_error(
                "DESTINATION_DATA_UNAVAILABLE",
                503,
                f"Destination data not available for {dest_name}.",
            )

        try:
            from services.weather_engine import get_weather
            map_center = gemini_data.get("mapCenter") or {}
            weather_data = await get_weather(lat=map_center.get("lat"), lng=map_center.get("lng"))
            gemini_data["weather"] = weather_data
        except Exception as weather_error:
            print(f"[Itinerary] Weather fetch failed: {weather_error}")
            gemini_data["weather"] = {"current": None, "daily": [], "source": "none"}

        print("[Itinerary] Got destination data, running personalization...")
        result = generate_itinerary(user_context, gemini_data)
        if result:
            from services.geoapify_service import is_geoapify_configured
            dest_source = gemini_data.get("dataSources", {}).get("source", "cache")
            llm_used = gemini_data.get("dataSources", {}).get("llmUsed", False)
            weather_source = gemini_data.get("weather", {}).get("source", "none")
            data_sources_provenance = {
                "destination": dest_source,
                "weather": weather_source,
                "routing": "geoapify" if is_geoapify_configured() else "osrm",
                "grounding": "none",
                "llmUsed": llm_used,
            }
            if isinstance(gemini_data.get("dataSources"), dict):
                data_sources_provenance.update(gemini_data["dataSources"])
                data_sources_provenance["weather"] = weather_source

    if not result:
        raise _phase6_error("INTERNAL_ERROR", 500, "Failed to generate itinerary.")

    result = _ensure_activity_identity(result)
    revision_id = "rev_0"
    persisted_form = {
        # These two explicit records let readers distinguish caller input from
        # profile-enriched/effective generation context.
        "input": caller_form,
        "effective": copy.deepcopy(user_context),
        # Keep the legacy flat form shape for existing readers.
        **caller_form,
    }
    receipt = {
        "operationId": operation_id,
        "itineraryId": operation_id,
        "ownerUid": authenticated_user_id,
        "revisionId": revision_id,
        "status": "committed",
    }
    itinerary_data = {
        **result,
        "id": operation_id,
        "itineraryId": operation_id,
        "userId": authenticated_user_id,
        "ownerUid": authenticated_user_id,
        "revisionId": revision_id,
    }

    try:
        # This is the single persistence-service call for both normal and
        # multi-city generation paths. The service owns the transaction,
        # canonical owner document ID, receipt, and idempotency write.
        persistence_result = await save_itinerary(
            authenticated_user_id,
            {
                "operationId": operation_id,
                "destination": resolved_dest,
                "destName": result.get("destName", dest_name),
                "form": persisted_form,
                "generatedData": itinerary_data,
                "source": source,
                **({"dataSources": data_sources_provenance} if data_sources_provenance is not None else {}),
            },
        )
    except Exception as persistence_error:
        print(f"[Itinerary] Persistence failed: {persistence_error}")
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "The itinerary could not be durably saved.")

    if not isinstance(persistence_result, dict) or not persistence_result.get("durable"):
        error_code = (persistence_result or {}).get("errorCode", "PERSISTENCE_UNAVAILABLE") if isinstance(persistence_result, dict) else "PERSISTENCE_UNAVAILABLE"
        if error_code == "IDEMPOTENCY_CONFLICT":
            reconciled_data = _doc_data(await _firestore_call(itinerary_ref.get))
            if reconciled_data is not None:
                replay = _replay_or_conflict(reconciled_data, caller_form, authenticated_user_id, operation_id)
                if replay is not None:
                    return replay
        error_status = 409 if error_code == "IDEMPOTENCY_CONFLICT" else 503
        message = (
            "operationId was already used for a different generation request."
            if error_code == "IDEMPOTENCY_CONFLICT"
            else "The itinerary could not be durably saved."
        )
        raise _phase6_error(error_code, error_status, message)
    if persistence_result.get("replayed"):
        replayed_data = _doc_data(await _firestore_call(itinerary_ref.get))
        if replayed_data is None:
            raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "The saved itinerary could not be reconciled.")
        replay = _replay_or_conflict(replayed_data, caller_form, authenticated_user_id, operation_id)
        if replay is not None:
            return replay
        raise _phase6_error("IDEMPOTENCY_CONFLICT", 409, "The generation operation could not be reconciled safely.")
    receipt = copy.deepcopy(persistence_result.get("receipt") or receipt)

    response = {
        "success": True,
        "userId": authenticated_user_id,
        "itinerary": itinerary_data,
        "source": source,
        "persistence": {"status": "saved", "durable": True, "replayed": False},
        "receipt": receipt,
    }
    if data_sources_provenance is not None:
        response["dataSources"] = data_sources_provenance
    return response


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




async def _generate_multi_city_itinerary(base_context: Dict[str, Any], route_stops: List[RouteStop]) -> Optional[dict]:
    """Generate city plans and explicit transit days for an ordered route.

    ``days`` is the full trip length. Every city-to-city leg reserves one whole
    day so we never hide a long transfer inside an attraction-heavy schedule.
    """
    primary_days = base_context["days"] - len(route_stops) - sum(stop.stayDays for stop in route_stops)
    if primary_days < 1:
        required_days = len(route_stops) + sum(stop.stayDays for stop in route_stops) + 1
        raise _phase6_error(
            "VALIDATION_ERROR",
            422,
            f"This route needs at least {required_days} days: one stay day per city plus one transit day per transfer.",
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
        )
        if not city_data:
            raise _phase6_error(
                "DESTINATION_DATA_UNAVAILABLE",
                503,
                f"Destination data not available for {city_name}. Please try again later.",
            )

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
                from_center=city_result.get("mapCenter") or {},
                to_center=next_result.get("mapCenter") or {},
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


class ReplanRequest(BaseModel):
    itineraryId: str = Field(min_length=1)
    operationId: Optional[str] = None
    currentDayNumber: Optional[int] = None
    # ``dayNumber`` is a compatibility spelling with the same 1-based meaning.
    dayNumber: Optional[int] = None
    # Legacy clients sent a zero-based index. It is accepted only if neither
    # canonical day-number field is present.
    currentDay: Optional[int] = None
    currentTime: str = Field(min_length=1)
    reason: str = Field(min_length=1)
    completedActivityIds: List[str] = Field(default_factory=list)
    skippedActivityIds: List[str] = Field(default_factory=list)
    location: Optional[Dict[str, float]] = None
    destinationTimezone: str = "UTC"
    baseRevisionId: str = Field(min_length=1)


class ReplanAcceptRequest(BaseModel):
    itineraryId: str = Field(min_length=1)
    proposalId: str = Field(min_length=1)
    baseRevisionId: str = Field(min_length=1)
    operationId: Optional[str] = None
    # Accepted for old clients but deliberately ignored. The persisted server
    # proposal is the only mutation authority.
    proposalData: Optional[Dict[str, Any]] = None


def _trip_from_owner(owner_data: dict, uid: str, itinerary_id: str) -> dict:
    trip = _authoritative_itinerary(owner_data, uid, itinerary_id)
    trip["form"] = copy.deepcopy(owner_data.get("form") or trip.get("form") or {})
    trip["revisions"] = copy.deepcopy(owner_data.get("revisions") or trip.get("revisions") or [])
    if not trip["revisions"]:
        trip["revisions"] = [{"revisionId": owner_data.get("revisionId", "rev_0")}]
    return trip


def _current_revision(owner_data: dict) -> str:
    if owner_data.get("revisionId"):
        return owner_data["revisionId"]
    revisions = owner_data.get("revisions") or []
    if revisions and revisions[-1].get("revisionId"):
        return revisions[-1]["revisionId"]
    return "rev_0"


def _activity_id(activity: dict) -> Optional[str]:
    activity_id = activity.get("activityId")
    if isinstance(activity_id, str) and activity_id:
        return activity_id
    legacy_id = activity.get("id")
    return legacy_id if isinstance(legacy_id, str) and legacy_id else None


def _require_activity_identity(trip: dict) -> dict:
    """Accept stable identities and only unambiguous legacy name reads."""
    normalized = copy.deepcopy(trip)
    seen: set[str] = set()
    for plan in normalized.get("dayPlans", []):
        for activity in plan.get("activities", []):
            activity_id = _activity_id(activity)
            if activity_id is None:
                title = activity.get("name", activity.get("title"))
                if not isinstance(title, str) or not title.strip():
                    raise _phase6_error(
                        "REPLAN_VALIDATION_ERROR",
                        422,
                        "Every activity must have a name or stable activity identity.",
                    )
                activity_id = " ".join(title.casefold().split())
                # The protected engine can safely address a unique legacy
                # occurrence through this compatibility identity. It is never
                # assigned as a new activityId or used for generated data.
                activity["id"] = activity_id
            if activity_id in seen:
                raise _phase6_error(
                    "ACTIVITY_IDENTITY_AMBIGUOUS",
                    409,
                    "This legacy itinerary does not have unambiguous activity identities.",
                )
            seen.add(activity_id)
            # The protected replan engine still reads its legacy ``id`` field.
            activity["id"] = activity_id
    return normalized


def _day_index(day_plans: list, day_number: int) -> Optional[int]:
    matches = [
        index for index, plan in enumerate(day_plans)
        if isinstance(plan, dict) and plan.get("dayNumber") == day_number
    ]
    if len(matches) == 1:
        return matches[0]
    # A legacy day field is safe only when it identifies one list element.
    legacy_matches = [
        index for index, plan in enumerate(day_plans)
        if isinstance(plan, dict) and plan.get("day") == day_number
    ]
    return legacy_matches[0] if len(legacy_matches) == 1 else None


def _requested_day_number(payload: ReplanRequest, day_plans: list) -> int:
    canonical = [value for value in (payload.currentDayNumber, payload.dayNumber) if value is not None]
    if len(canonical) == 2 and canonical[0] != canonical[1]:
        raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, "currentDayNumber and dayNumber must match.")
    if canonical:
        day_number = canonical[0]
        if day_number < 1 or _day_index(day_plans, day_number) is None:
            raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, "currentDayNumber is not in the itinerary.")
        return day_number
    if payload.currentDay is not None and 0 <= payload.currentDay < len(day_plans):
        plan = day_plans[payload.currentDay]
        day_number = plan.get("dayNumber", plan.get("day"))
        if isinstance(day_number, int):
            return day_number
    raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, "currentDayNumber is required.")


def _proposal_payload(proposal) -> dict:
    if hasattr(proposal, "model_dump"):
        return proposal.model_dump(mode="json")
    if hasattr(proposal, "dict"):
        return proposal.dict()
    if isinstance(proposal, dict):
        return copy.deepcopy(proposal)
    raise _phase6_error("INTERNAL_ERROR", 500, "The replan engine returned an invalid proposal.")


def _find_proposal_by_operation(proposals_ref, operation_id: str) -> Optional[dict]:
    """Use a query only for the explicit idempotency field; never trust client data."""
    try:
        matches = proposals_ref.where("operationId", "==", operation_id).limit(1).stream()
        for document in matches:
            data = _doc_data(document)
            if data is not None:
                data.setdefault("proposalId", getattr(document, "id", None))
                return data
    except (AttributeError, TypeError, NotImplementedError):
        # Minimal fakes and older Firestore adapters may not implement queries.
        return None
    return None


def _transactional_proposal_create(
    db,
    itinerary_ref,
    proposal_ref,
    expected_owner: dict,
    proposal_data: dict,
    request_fingerprint: str,
):
    """Create one deterministic proposal document or replay it atomically."""
    transaction_factory = getattr(db, "transaction", None)
    if not callable(transaction_factory):
        raise RuntimeError("Firestore transactions are unavailable")

    transaction = transaction_factory()

    @firestore.transactional
    def commit(transaction):
        owner_snapshot = next(transaction.get(itinerary_ref), None)
        latest_owner = _doc_data(owner_snapshot)
        if latest_owner != expected_owner:
            raise _phase6_error("STALE_PROPOSAL", 409, "The itinerary changed before the proposal was saved.")

        proposal_snapshot = next(transaction.get(proposal_ref), None)
        if proposal_snapshot is not None and proposal_snapshot.exists:
            existing = _doc_data(proposal_snapshot) or {}
            if existing.get("requestFingerprint") != request_fingerprint:
                raise _phase6_error(
                    "IDEMPOTENCY_CONFLICT",
                    409,
                    "operationId was already used for a different replan request.",
                )
            existing.setdefault("proposalId", getattr(proposal_snapshot, "id", None))
            return "existing", existing

        transaction.create(proposal_ref, proposal_data)
        return "created", proposal_data

    return commit(transaction)


def _is_protected_activity(activity: dict, form: dict) -> bool:
    if activity.get("isBooked") or "booking" in activity or "reservation" in activity:
        return True
    name = str(activity.get("name", activity.get("title", ""))).lower()
    if any(term in name for term in ("reservation", "ticket", "flight", "train")):
        return True
    nested_input = form.get("input") if isinstance(form, dict) else None
    must_do = form.get("mustDo") if isinstance(form, dict) else None
    if must_do is None and isinstance(nested_input, dict):
        must_do = nested_input.get("mustDo")
    must_do = must_do or []
    activity_id = _activity_id(activity)
    ids = set()
    names = set()
    for item in must_do:
        if isinstance(item, str):
            ids.add(item)
            names.add(" ".join(item.casefold().split()))
        elif isinstance(item, dict):
            for key in ("activityId", "id"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    ids.add(value.strip())
            for key in ("name", "title"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    names.add(" ".join(value.casefold().split()))
    return activity_id in ids or " ".join(name.casefold().split()) in names or bool(activity.get("isMustDo"))


def _next_revision_id(current_revision: str) -> str:
    match = re.fullmatch(r"rev_(\d+)", current_revision or "")
    return f"rev_{int(match.group(1)) + 1}" if match else "rev_1"


def _apply_server_proposal(trip: dict, proposal: dict) -> tuple[dict, list[int]]:
    updated = copy.deepcopy(trip)
    day_plans = updated.get("dayPlans") or []
    affected = proposal.get("affectedDate", "")
    match = re.fullmatch(r"Day\s+(\d+)", str(affected))
    if not match:
        raise _phase6_error("INVALID_STATE", 409, "The server proposal has an invalid affected day.")
    affected_number = int(match.group(1))
    affected_index = _day_index(day_plans, affected_number)
    if affected_index is None:
        raise _phase6_error("INVALID_STATE", 409, "The server proposal targets an unavailable day.")

    activities = day_plans[affected_index].get("activities", [])
    activity_map = {_activity_id(activity): activity for activity in activities}
    if None in activity_map or len(activity_map) != len(activities):
        raise _phase6_error("ACTIVITY_IDENTITY_AMBIGUOUS", 409, "Activity identities are not unique.")

    completed = set(proposal.get("completedActivityIds") or [])
    skipped = set(proposal.get("skippedActivityIds") or [])
    action_by_id = {}
    changed_indices = {affected_index}
    moves: list[tuple[int, dict]] = []
    allowed_actions = {"KEEP", "REMOVE", "MOVE_TO_LATER_DAY", "SAVE_FOR_LATER", "REPLACE", "END_DAY_EARLY"}

    for action in proposal.get("actions") or []:
        action_type = action.get("actionType")
        activity_id = action.get("activityId")
        if action_type not in allowed_actions:
            raise _phase6_error("INVALID_STATE", 409, "The server proposal contains an unsupported action.")
        if action_type == "END_DAY_EARLY":
            continue
        if not isinstance(activity_id, str) or activity_id not in activity_map:
            raise _phase6_error("INVALID_STATE", 409, "The server proposal references an unknown activity.")
        if activity_id in action_by_id:
            raise _phase6_error("INVALID_STATE", 409, "The server proposal contains duplicate activity actions.")
        action_by_id[activity_id] = action

    new_activities = []
    for activity in activities:
        activity_id = _activity_id(activity)
        action = action_by_id.get(activity_id)
        protected = _is_protected_activity(activity, updated.get("form") or {})
        # These records are explicit server state, not reconstructed from an
        # action list, so completed/skipped activities cannot disappear.
        if activity_id in completed or activity_id in skipped:
            new_activities.append(activity)
            continue
        if action is None or action.get("actionType") == "KEEP":
            new_activities.append(activity)
            continue

        action_type = action.get("actionType")
        if protected and action_type in {"REMOVE", "SAVE_FOR_LATER", "REPLACE"}:
            raise _phase6_error("INVALID_STATE", 409, "The proposal attempts to remove a protected activity.")
        if action_type in {"REMOVE", "SAVE_FOR_LATER"}:
            continue
        if action_type == "REPLACE":
            replacement = action.get("replacementActivity")
            if not isinstance(replacement, dict):
                raise _phase6_error("INVALID_STATE", 409, "The replacement activity is invalid.")
            replacement = copy.deepcopy(replacement)
            replacement_id = replacement.get("activityId")
            if not isinstance(replacement_id, str) or not replacement_id.strip():
                raise _phase6_error("ACTIVITY_IDENTITY_AMBIGUOUS", 409, "Replacement activity lacks a stable identity.")
            if replacement_id in activity_map:
                raise _phase6_error("ACTIVITY_IDENTITY_AMBIGUOUS", 409, "Replacement activity identity is already in use.")
            replacement["activityId"] = replacement_id
            replacement.setdefault("id", replacement_id)
            new_activities.append(replacement)
            continue
        if action_type == "MOVE_TO_LATER_DAY":
            target_match = re.fullmatch(r"Day\s+(\d+)", str(action.get("targetDate", "")))
            if not target_match:
                raise _phase6_error("INVALID_STATE", 409, "The move target day is invalid.")
            target_index = _day_index(day_plans, int(target_match.group(1)))
            if target_index is None or target_index == affected_index:
                raise _phase6_error("INVALID_STATE", 409, "The move target day is unavailable.")
            changed_indices.add(target_index)
            moves.append((target_index, activity))
            continue
        # END_DAY_EARLY was handled above; no other action reaches here.
        raise _phase6_error("INVALID_STATE", 409, "The server proposal contains an invalid action.")

    day_plans[affected_index]["activities"] = new_activities
    for target_index, activity in moves:
        day_plans[target_index].setdefault("activities", []).append(activity)
    updated["dayPlans"] = day_plans
    return updated, sorted(changed_indices)


def _acceptance_response(owner_data: dict, uid: str, itinerary_id: str, receipt: dict) -> dict:
    return {
        "success": True,
        "status": "accepted",
        "itinerary": _authoritative_itinerary(owner_data, uid, itinerary_id),
        "receipt": receipt,
    }


def _transactional_owner_write(
    db,
    itinerary_ref,
    proposal_ref,
    expected_owner: dict,
    expected_proposal: dict,
    updated_owner: dict,
    operation_id: str,
    itinerary_id: str,
    proposal_id: str,
):
    """Re-read the owner/proposal in one Firestore transaction before commit.

    The route computes the admissible mutation from an immutable snapshot. The
    transaction re-check prevents a competing revision or proposal edit from
    being accepted between that read and the owner write.
    """
    transaction_factory = getattr(db, "transaction", None)
    if not callable(transaction_factory):
        raise RuntimeError("Firestore transactions are unavailable")

    transaction = transaction_factory()

    @firestore.transactional
    def commit(transaction):
        owner_snapshot = next(transaction.get(itinerary_ref), None)
        proposal_snapshot = next(transaction.get(proposal_ref), None)
        latest_owner = _doc_data(owner_snapshot)
        latest_proposal = _doc_data(proposal_snapshot)
        if latest_owner != expected_owner or latest_proposal != expected_proposal:
            previous_receipt = ((latest_owner or {}).get("acceptanceReceipts") or {}).get(operation_id)
            if (
                isinstance(previous_receipt, dict)
                and previous_receipt.get("itineraryId") == itinerary_id
                and previous_receipt.get("proposalId") == proposal_id
                and previous_receipt.get("previousRevisionId") == expected_proposal.get("baseRevisionId")
            ):
                return "existing", latest_owner
            if previous_receipt is not None:
                raise _phase6_error("IDEMPOTENCY_CONFLICT", 409, "operationId was already used for a different acceptance.")
            raise _phase6_error("STALE_PROPOSAL", 409, "The itinerary or proposal changed before acceptance.")
        transaction.set(itinerary_ref, updated_owner)

    return commit(transaction)


@router.post("/replan")
async def replan_itinerary(payload: ReplanRequest, request: Request, uid: CurrentUserId):
    operation_id = _operation_id(payload.operationId, request.headers.get("Idempotency-Key"))
    db = get_db()
    if db is None:
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "Itinerary persistence is unavailable.")

    itinerary_ref = _owner_itinerary_ref(db, uid, payload.itineraryId)
    owner_data = _doc_data(await _firestore_call(itinerary_ref.get))
    if owner_data is None:
        raise _phase6_error("ITINERARY_NOT_FOUND", 404, "The itinerary was not found.")

    proposals_ref = itinerary_ref.collection("proposals")
    request_fingerprint = _fingerprint(payload.model_dump(exclude={"operationId"}))
    # Idempotent replay is checked before current-revision validation. A retry
    # may arrive after a later, unrelated acceptance and must still return its
    # original server proposal rather than being mistaken for a new request.
    existing_proposal = _find_proposal_by_operation(proposals_ref, operation_id)
    if existing_proposal is not None:
        if existing_proposal.get("requestFingerprint") != request_fingerprint:
            raise _phase6_error("IDEMPOTENCY_CONFLICT", 409, "operationId was already used for a different replan request.")
        return {"success": True, "proposal": existing_proposal, "replayed": True}

    status = str(owner_data.get("status") or (owner_data.get("generatedData") or {}).get("status") or "").lower()
    if status in {"completed", "cancelled", "canceled"}:
        raise _phase6_error("TRIP_TERMINAL", 409, "This journey has ended and cannot be replanned.")

    trip = _require_activity_identity(_trip_from_owner(owner_data, uid, payload.itineraryId))
    day_number = _requested_day_number(payload, trip.get("dayPlans") or [])
    current_revision = _current_revision(owner_data)
    if payload.baseRevisionId != current_revision:
        raise _phase6_error("STALE_PROPOSAL", 409, "The itinerary has changed since this request was created.")
    if payload.reason != "I_AM_TIRED":
        raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, "Unsupported replan reason.")

    current_index = _day_index(trip.get("dayPlans") or [], day_number)
    if current_index is None:
        raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, "currentDayNumber is not in the itinerary.")
    try:
        proposal = generate_replan_proposal(
            trip=trip,
            # The supported tired replan only simplifies existing owner
            # activities. The engine does not consume destination candidates,
            # so provider availability must not block this operation.
            dest_data={},
            current_time=payload.currentTime,
            reason=payload.reason,
            completed_activity_ids=payload.completedActivityIds,
            skipped_activity_ids=payload.skippedActivityIds,
            location=payload.location,
            destinationTimezone=payload.destinationTimezone,
            baseRevisionId=payload.baseRevisionId,
            current_day_number=day_number,
        )
    except ActivityIdentityAmbiguousError as validation_error:
        raise _phase6_error("ACTIVITY_IDENTITY_AMBIGUOUS", 409, str(validation_error))
    except ReplanValidationError as validation_error:
        raise _phase6_error("REPLAN_VALIDATION_ERROR", 422, str(validation_error))
    except AppError:
        raise
    except Exception as engine_error:
        print(f"[Replan] Provider/engine error: {engine_error}")
        raise _phase6_error("REPLAN_PROVIDER_UNAVAILABLE", 503, "Replanning is temporarily unavailable.")

    proposal_data = _proposal_payload(proposal)
    # The caller operation is also the proposal identity. This makes retries
    # address one document directly and lets the transaction reject a race.
    proposal_id = operation_id
    proposal_data.update({
        "proposalId": proposal_id,
        "tripId": payload.itineraryId,
        "itineraryId": payload.itineraryId,
        "ownerUid": uid,
        "operationId": operation_id,
        "baseRevisionId": payload.baseRevisionId,
        "currentDayNumber": day_number,
        "completedActivityIds": list(payload.completedActivityIds),
        "skippedActivityIds": list(payload.skippedActivityIds),
        "requestFingerprint": request_fingerprint,
    })
    proposal_ref = proposals_ref.document(proposal_id)
    try:
        # The client never supplies proposalData; this is the server-owned
        # proposal persisted beneath the verified owner's itinerary.
        action, persisted_proposal = await _firestore_call(
            _transactional_proposal_create,
            db,
            itinerary_ref,
            proposal_ref,
            owner_data,
            proposal_data,
            request_fingerprint,
        )
    except Exception as persistence_error:
        if isinstance(persistence_error, AppError):
            raise
        print(f"[Replan] Proposal persistence failed: {persistence_error}")
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "The replan proposal could not be saved.")
    return {
        "success": True,
        "proposal": persisted_proposal or proposal_data,
        "replayed": action == "existing",
    }


@router.post("/replan/accept")
async def accept_replan(payload: ReplanAcceptRequest, request: Request, uid: CurrentUserId):
    operation_id = _operation_id(payload.operationId, request.headers.get("Idempotency-Key"))
    db = get_db()
    if db is None:
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "Itinerary persistence is unavailable.")

    itinerary_ref = _owner_itinerary_ref(db, uid, payload.itineraryId)
    owner_data = _doc_data(await _firestore_call(itinerary_ref.get))
    if owner_data is None:
        raise _phase6_error("ITINERARY_NOT_FOUND", 404, "The itinerary was not found.")

    acceptance_receipts = owner_data.get("acceptanceReceipts") or {}
    previous_receipt = acceptance_receipts.get(operation_id)
    if previous_receipt is not None:
        if (
            previous_receipt.get("proposalId") != payload.proposalId
            or previous_receipt.get("itineraryId") != payload.itineraryId
            or previous_receipt.get("previousRevisionId") != payload.baseRevisionId
        ):
            raise _phase6_error("IDEMPOTENCY_CONFLICT", 409, "operationId was already used for a different acceptance.")
        return _acceptance_response(owner_data, uid, payload.itineraryId, previous_receipt)

    proposal_ref = itinerary_ref.collection("proposals").document(payload.proposalId)
    proposal = _doc_data(await _firestore_call(proposal_ref.get))
    if proposal is None:
        raise _phase6_error("PROPOSAL_NOT_FOUND", 404, "The replan proposal was not found.")

    current_revision = _current_revision(owner_data)
    if payload.baseRevisionId != current_revision or proposal.get("baseRevisionId") != current_revision:
        raise _phase6_error("STALE_PROPOSAL", 409, "The proposal is based on an older itinerary revision.")
    if proposal.get("itineraryId", proposal.get("tripId")) != payload.itineraryId:
        raise _phase6_error("FORBIDDEN", 403, "The proposal does not belong to this itinerary.")
    if proposal.get("ownerUid") and proposal.get("ownerUid") != uid:
        raise _phase6_error("FORBIDDEN", 403, "The proposal does not belong to this owner.")

    status = str(owner_data.get("status") or (owner_data.get("generatedData") or {}).get("status") or "").lower()
    if status in {"completed", "cancelled", "canceled"}:
        raise _phase6_error("TRIP_TERMINAL", 409, "This journey has ended and cannot be replanned.")

    trip = _require_activity_identity(_trip_from_owner(owner_data, uid, payload.itineraryId))
    updated_trip, changed_indices = _apply_server_proposal(trip, proposal)
    new_revision_id = _next_revision_id(current_revision)
    updated_trip["revisionId"] = new_revision_id
    updated_trip["id"] = payload.itineraryId
    updated_trip["itineraryId"] = payload.itineraryId
    updated_trip["userId"] = uid
    updated_trip["ownerUid"] = uid

    receipt = {
        "status": "accepted",
        "ownerUid": uid,
        "itineraryId": payload.itineraryId,
        "proposalId": payload.proposalId,
        "operationId": operation_id,
        "previousRevisionId": current_revision,
        "revisionId": new_revision_id,
        "idempotent": False,
    }
    updated_owner = copy.deepcopy(owner_data)
    updated_owner["generatedData"] = updated_trip
    updated_owner["revisionId"] = new_revision_id
    revisions = copy.deepcopy(owner_data.get("revisions") or [])
    revisions.append({
        "revisionId": new_revision_id,
        "previousRevisionId": current_revision,
        "proposalId": payload.proposalId,
        "reason": proposal.get("reason"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dayPlans": [updated_trip["dayPlans"][index] for index in changed_indices],
    })
    updated_owner["revisions"] = revisions
    updated_owner["acceptanceReceipts"] = {**acceptance_receipts, operation_id: receipt}
    # Keep the original generation receipt intact for generation replays while
    # exposing the latest server-owned acceptance receipt for itinerary reads.
    updated_owner["lastReceipt"] = receipt

    try:
        # The itinerary, new revision, and idempotency receipt are committed in
        # one owner-document write. The client proposal body is not persisted.
        transaction_result = await _firestore_call(
            _transactional_owner_write,
            db,
            itinerary_ref,
            proposal_ref,
            owner_data,
            proposal,
            updated_owner,
            operation_id,
            payload.itineraryId,
            payload.proposalId,
        )
    except AppError:
        raise
    except Exception as persistence_error:
        print(f"[ReplanAccept] Persistence failed: {persistence_error}")
        raise _phase6_error("PERSISTENCE_UNAVAILABLE", 503, "The accepted itinerary could not be saved.")

    if isinstance(transaction_result, tuple) and transaction_result[0] == "existing":
        replay_owner = transaction_result[1]
        replay_receipt = (replay_owner.get("acceptanceReceipts") or {}).get(operation_id)
        return _acceptance_response(replay_owner, uid, payload.itineraryId, replay_receipt)
    return _acceptance_response(updated_owner, uid, payload.itineraryId, receipt)
