# ─── User Data Service (Firestore) ──────────────────────────────────────────────
# Manages all user-specific data in Firestore, matching the frontend schema exactly.
#
# Collections:
#   users/{uid}/preferences/main    — Travel preferences (interests, style, group)
#   users/{uid}/ai_profile/main     — AI-specific data (taste vector, browsing signals, past dests)
#   users/{uid}/itineraries/{id}    — Saved generated itineraries
#
# The ai_profile subcollection is NEW and stores data the Python backend generates:
#   - tasteVector: 768-dim embedding representing the user's travel preferences
#   - browsingSignals: accumulated browsing behavior from the frontend
#   - pastDestinations: list of destination IDs the user has generated itineraries for
#   - lastRecommendations: cached recommendation scores for faster repeat loads

from hashlib import sha256
import json
from typing import Optional, Dict, Any, List, Tuple
from services.firebase_client import get_db, is_firebase_configured
from firebase_admin import firestore
import asyncio


# ────────────────────────────────────────────────────────────────────────────
# User Preferences (reads the SAME doc the frontend writes)
# Path: users/{uid}/preferences/main
# ────────────────────────────────────────────────────────────────────────────

async def get_user_preferences(uid: str) -> Optional[Dict[str, Any]]:
    """Get user preferences from Firestore (same schema as frontend)."""
    db = get_db()
    if not db:
        return None
    try:
        doc = await asyncio.to_thread(db.collection("users").document(uid).collection("preferences").document("main").get)
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"[UserData] Error getting preferences for {uid}: {e}")
        return None


async def update_user_preferences(uid: str, prefs: Dict[str, Any]):
    """Update user preferences in Firestore."""
    db = get_db()
    if not db:
        return
    try:
        ref = db.collection("users").document(uid).collection("preferences").document("main")
        doc = await asyncio.to_thread(ref.get)
        if doc.exists:
            await asyncio.to_thread(ref.update, {**prefs, "updatedAt": firestore.SERVER_TIMESTAMP})
        else:
            await asyncio.to_thread(ref.set, {
                "travelStyle": None,
                "preferredGroup": None,
                "interests": [],
                "dietaryPreferences": [],
                "accessibilityNeeds": [],
                "homeCity": None,
                "recentSearches": [],
                **prefs,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            })
    except Exception as e:
        print(f"[UserData] Error updating preferences for {uid}: {e}")


# ────────────────────────────────────────────────────────────────────────────
# AI Profile (NEW — stores taste vector, browsing signals, etc.)
# Path: users/{uid}/ai_profile/main
# ────────────────────────────────────────────────────────────────────────────

async def get_ai_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Get the user's AI profile (taste vector, browsing signals, past destinations)."""
    db = get_db()
    if not db:
        return None
    try:
        doc = await asyncio.to_thread(db.collection("users").document(uid).collection("ai_profile").document("main").get)
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"[UserData] Error getting AI profile for {uid}: {e}")
        return None


async def update_ai_profile(uid: str, data: Dict[str, Any]):
    """Update the user's AI profile."""
    db = get_db()
    if not db:
        return
    try:
        ref = db.collection("users").document(uid).collection("ai_profile").document("main")
        await asyncio.to_thread(ref.set, {**data, "updatedAt": firestore.SERVER_TIMESTAMP}, merge=True)
    except Exception as e:
        print(f"[UserData] Error updating AI profile for {uid}: {e}")


async def update_taste_vector(uid: str, vector: List[float]):
    """Update just the taste vector in the user's AI profile."""
    await update_ai_profile(uid, {"tasteVector": vector})


async def update_browsing_signals(uid: str, signals: Dict[str, Any]):
    """Merge new browsing signals into the user's AI profile."""
    db = get_db()
    if not db:
        return
    try:
        existing = await get_ai_profile(uid)
        current_signals = (existing or {}).get("browsingSignals", {})
        
        # Merge deep dive vibes (replace per dest) safely
        existing_vibes = current_signals.get("deepDiveVibes", [])
        new_vibes = signals.get("deepDiveVibes", [])
        vibe_map = {v["dest"]: v for v in existing_vibes if "dest" in v}
        for v in new_vibes:
            if "dest" in v:
                vibe_map[v["dest"]] = v
        merged_vibes = list(vibe_map.values())

        # Merge time on city (sum)
        existing_time = current_signals.get("timeOnCity", {})
        new_time = signals.get("timeOnCity", {})
        merged_time = {**existing_time}
        for city, t in new_time.items():
            merged_time[city] = merged_time.get(city, 0) + t

        ref = db.collection("users").document(uid).collection("ai_profile").document("main")
        updates = {
            "updatedAt": firestore.SERVER_TIMESTAMP,
            "browsingSignals": {
                "timeOnCity": merged_time,
                "deepDiveVibes": merged_vibes,
            }
        }
        
        new_cats = signals.get("clickedCategories", [])
        new_viewed = signals.get("viewedDestinations", [])
        
        if new_cats:
            updates["browsingSignals"]["clickedCategories"] = firestore.ArrayUnion(new_cats)
        if new_viewed:
            updates["browsingSignals"]["viewedDestinations"] = firestore.ArrayUnion(new_viewed)

        await asyncio.to_thread(ref.set, updates, merge=True)
    except Exception as e:
        print(f"[UserData] Error merging browsing signals for {uid}: {e}")


async def add_past_destination(uid: str, dest_id: str):
    """Add a destination to the user's trip history."""
    db = get_db()
    if not db:
        return
    try:
        ref = db.collection("users").document(uid).collection("ai_profile").document("main")
        await asyncio.to_thread(ref.set, {"pastDestinations": firestore.ArrayUnion([dest_id])}, merge=True)
    except Exception as e:
        print(f"[UserData] Error adding past destination for {uid}: {e}")


# ────────────────────────────────────────────────────────────────────────────
# Saved Itineraries (reads/writes the SAME collection as the frontend)
# Path: users/{uid}/itineraries/{itineraryId}
# ────────────────────────────────────────────────────────────────────────────

def _canonicalize_for_fingerprint(value: Any) -> Any:
    """Return a JSON-safe, deterministic representation of request data.

    Generated itinerary data occasionally contains values supplied by a provider
    rather than plain JSON primitives.  Fingerprinting must never make a save
    fail just because one of those values has a custom representation, so such
    values are represented by their string form.  This is only an idempotency
    comparison key; it is not used as persisted itinerary data.
    """
    if isinstance(value, dict):
        return {
            str(key): _canonicalize_for_fingerprint(item)
            for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))
        }
    if isinstance(value, (list, tuple)):
        return [_canonicalize_for_fingerprint(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _request_fingerprint(data: Dict[str, Any]) -> str:
    """Hash caller input, never provider output or generated identities."""
    form = data.get("form")
    if isinstance(form, dict) and isinstance(form.get("input"), dict):
        fingerprint_input = form["input"]
    else:
        # Older service callers do not wrap their input under form.input. Keep
        # the request envelope useful for those callers while excluding the
        # generated itinerary, whose activity IDs are intentionally random.
        fingerprint_input = {
            key: value
            for key, value in data.items()
            if key not in {
                "operationId",
                "operation_id",
                "fingerprint",
                "requestFingerprint",
                "generatedData",
                "source",
                "dataSources",
            }
        }
    encoded = json.dumps(
        _canonicalize_for_fingerprint(fingerprint_input),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=str,
    )
    return sha256(encoded.encode("utf-8")).hexdigest()


def _receipt(uid: str, operation_id: str, revision_id: str = "rev_0") -> Dict[str, Any]:
    """Build the stable receipt written with a canonical itinerary."""
    return {
        "operationId": operation_id,
        "itineraryId": operation_id,
        "ownerUid": uid,
        "revisionId": revision_id,
        "status": "committed",
    }


def _save_result(
    *,
    uid: str,
    operation_id: Optional[str],
    status: str,
    durable: bool,
    replayed: bool = False,
    receipt: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    **extra: Any,
) -> Dict[str, Any]:
    """Return one shape for saved, replayed, conflict, and unsaved outcomes."""
    result: Dict[str, Any] = {
        "status": status,
        "durable": durable,
        "replayed": replayed,
        # The HTTP contract exposes this portion under ``persistence``.  Keep
        # the same information at the service boundary so callers do not have
        # to infer durability from a nullable ID.
        "persistence": {
            "status": "saved" if durable else "unsaved",
            "durable": durable,
            "replayed": replayed,
        },
        "ownerUid": uid,
        "operationId": operation_id,
        "itineraryId": operation_id,
        "id": operation_id,
        "receipt": receipt,
    }
    if receipt:
        result["revisionId"] = receipt.get("revisionId")
    if error:
        # Keep both names because the API packet calls this a stable error code,
        # while service callers historically used an ``error`` field.
        result["error"] = error
        result["errorCode"] = error
    result.update(extra)
    return result


def _classify_existing_document(
    *,
    uid: str,
    operation_id: str,
    fingerprint: str,
    snapshot: Any,
) -> Dict[str, Any]:
    """Classify an owner-scoped document without changing legacy data."""
    existing = snapshot.to_dict() or {}
    stored_fingerprint = existing.get("requestFingerprint") or existing.get("fingerprint")

    # A legacy document with this ID has no safe way to prove that it represents
    # this operation.  Never overwrite it or pretend that it is a replay.
    if not stored_fingerprint:
        return _save_result(
            uid=uid,
            operation_id=operation_id,
            status="conflict",
            durable=False,
            error="IDEMPOTENCY_CONFLICT",
            legacy=True,
        )

    if stored_fingerprint != fingerprint:
        return _save_result(
            uid=uid,
            operation_id=operation_id,
            status="conflict",
            durable=False,
            error="IDEMPOTENCY_CONFLICT",
        )

    revision_id = existing.get("revisionId")
    stored_receipt = existing.get("receipt")
    # A fingerprint without the committed receipt is not enough to claim that
    # a previous write was acknowledged. In particular, never fabricate a
    # receipt for a client-created empty draft.
    if not isinstance(stored_receipt, dict) or stored_receipt.get("status") != "committed":
        return _save_result(
            uid=uid,
            operation_id=operation_id,
            status="conflict",
            durable=False,
            error="IDEMPOTENCY_CONFLICT",
        )
    # Rebuild owner/operation identity from the verified path and request;
    # legacy or tampered in-document receipt fields are not authority.
    receipt = _receipt(
        uid,
        operation_id,
        stored_receipt.get("revisionId") or revision_id or "rev_0",
    )
    return _save_result(
        uid=uid,
        operation_id=operation_id,
        status="saved",
        durable=True,
        replayed=True,
        receipt=receipt,
    )


def _matching_empty_draft(existing: Dict[str, Any], caller_form: Dict[str, Any]) -> bool:
    """Return whether an owner-only setup handoff can be promoted safely."""
    stored_form = existing.get("form")
    stored_input = stored_form.get("input") if isinstance(stored_form, dict) else None
    return (
        existing.get("generatedData") is None
        and not existing.get("requestFingerprint")
        and not existing.get("fingerprint")
        and not existing.get("receipt")
        and isinstance(stored_input, dict)
        and _canonicalize_for_fingerprint(stored_input)
        == _canonicalize_for_fingerprint(caller_form)
    )


def _transaction_snapshot(transaction: Any, reference: Any) -> Any:
    """Read one snapshot from the Admin SDK transaction stream."""
    return next(transaction.get(reference), None)


def _persist_with_transaction(
    db: Any,
    itinerary_ref: Any,
    profile_ref: Any,
    itinerary_data: Dict[str, Any],
    uid: str,
    operation_id: str,
    fingerprint: str,
    caller_form: Dict[str, Any],
) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Create or promote the owner document in a real Firestore transaction."""
    transaction = db.transaction()

    @firestore.transactional
    def commit(transaction):
        existing_snapshot = _transaction_snapshot(transaction, itinerary_ref)
        if existing_snapshot is not None and existing_snapshot.exists:
            existing_data = existing_snapshot.to_dict() or {}
            if _matching_empty_draft(existing_data, caller_form):
                # SetupWizard writes an owner-scoped handoff before generation.
                # Replace it only after the transaction proves the form matches;
                # this is promotion, not an overwrite of an unrelated trip.
                profile_snapshot = _transaction_snapshot(transaction, profile_ref)
                transaction.set(itinerary_ref, itinerary_data)
                if profile_snapshot is not None and profile_snapshot.exists:
                    transaction.update(profile_ref, {"totalTrips": firestore.Increment(1)})
                return "created", None
            return "existing", _classify_existing_document(
                uid=uid,
                operation_id=operation_id,
                fingerprint=fingerprint,
                snapshot=existing_snapshot,
            )

        # Reading before writing is required by Firestore transactions. A
        # missing profile is valid: the itinerary remains durable and no
        # profile update is attempted for a document that does not exist.
        profile_snapshot = _transaction_snapshot(transaction, profile_ref)
        transaction.create(itinerary_ref, itinerary_data)
        if profile_snapshot is not None and profile_snapshot.exists:
            transaction.update(profile_ref, {"totalTrips": firestore.Increment(1)})
        return "created", None

    # The Admin SDK wrapper begins, retries, and commits the transaction. Do
    # not replace this with direct reads/writes for lightweight test doubles:
    # that would hide the production race this boundary is meant to prevent.
    return commit(transaction)


def _persist_itinerary_sync(
    db: Any,
    itinerary_ref: Any,
    profile_ref: Any,
    itinerary_data: Dict[str, Any],
    uid: str,
    operation_id: str,
    fingerprint: str,
    caller_form: Dict[str, Any],
) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Run all Firestore sync work in a worker thread."""
    if not callable(getattr(db, "transaction", None)):
        raise RuntimeError("Firestore transactions are unavailable")
    return _persist_with_transaction(
        db,
        itinerary_ref,
        profile_ref,
        itinerary_data,
        uid,
        operation_id,
        fingerprint,
        caller_form,
    )


async def save_itinerary(
    uid: str,
    data: Dict[str, Any],
    operation_id: Optional[str] = None,
    operationId: Optional[str] = None,
) -> Dict[str, Any]:
    """Persist a canonical generated itinerary with an idempotent receipt.

    ``operation_id`` is deliberately caller-supplied.  We do not generate a
    fallback ID: a generated ID would make a retry impossible to reconcile and
    would violate the Phase 6 owner-document contract.  The camel-case alias
    and the value in ``data`` preserve compatibility with existing callers while
    the backend router migrates to the frozen request shape.
    """
    request_data = dict(data or {})
    resolved_operation_id = (
        operation_id
        or operationId
        or request_data.get("operationId")
        or request_data.get("operation_id")
    )
    if not resolved_operation_id:
        return _save_result(
            uid=uid,
            operation_id=None,
            status="unsaved",
            durable=False,
            error="OPERATION_ID_REQUIRED",
        )

    try:
        db = get_db()
    except Exception as e:
        print(f"[UserData] Error opening Firestore for {uid}: {e}")
        return _save_result(
            uid=uid,
            operation_id=resolved_operation_id,
            status="unsaved",
            durable=False,
            error="FIREBASE_UNAVAILABLE",
            detail=str(e),
        )
    if not db:
        return _save_result(
            uid=uid,
            operation_id=resolved_operation_id,
            status="unsaved",
            durable=False,
            error="FIREBASE_UNAVAILABLE",
        )

    fingerprint = _request_fingerprint(request_data)
    form = request_data.get("form")
    caller_form = (
        form.get("input")
        if isinstance(form, dict) and isinstance(form.get("input"), dict)
        else form
        if isinstance(form, dict)
        else {}
    )
    itinerary_data = {
        # Keep the document ID and the legacy in-document identifiers aligned.
        # Reads in older clients use ``id``/``uuid`` while Phase 6 uses the
        # owner document ID as the operation identity.
        "id": resolved_operation_id,
        "itineraryId": resolved_operation_id,
        "uuid": resolved_operation_id,
        "userId": uid,
        "ownerUid": uid,
        "operationId": resolved_operation_id,
        "requestFingerprint": fingerprint,
        "destId": request_data.get("destination", ""),
        "destName": request_data.get("destName", ""),
        "form": request_data.get("form", {}),
        "generatedData": request_data.get("generatedData"),
        "isActive": False,
        "status": "planned",
        "revisionId": "rev_0",
        "revisions": [{"revisionId": "rev_0", "status": "planned"}],
        "receipt": _receipt(uid, resolved_operation_id),
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    # Preserve server-produced provenance fields when this service is called by
    # a generation boundary that already computed them.  Never copy client
    # owner identity fields into the authoritative document.
    for optional_field in ("source", "dataSources"):
        if optional_field in request_data:
            itinerary_data[optional_field] = request_data[optional_field]

    try:
        col_ref = db.collection("users").document(uid).collection("itineraries")
        itinerary_ref = col_ref.document(resolved_operation_id)
        profile_ref = db.collection("users").document(uid)
        action, existing_result = await asyncio.to_thread(
            _persist_itinerary_sync,
            db,
            itinerary_ref,
            profile_ref,
            itinerary_data,
            uid,
            resolved_operation_id,
            fingerprint,
            caller_form,
        )

        if action == "existing":
            # Replays and conflicts never repeat profile or AI side effects.
            return existing_result or _save_result(
                uid=uid,
                operation_id=resolved_operation_id,
                status="unsaved",
                durable=False,
                error="UNKNOWN_PERSISTENCE_RESULT",
            )

        # ArrayUnion in add_past_destination is itself idempotent.  It is only
        # invoked after a newly acknowledged owner write, never on a replay.
        destination_id = request_data.get("destination")
        if destination_id:
            try:
                await add_past_destination(uid, destination_id)
            except Exception as side_effect_error:
                # The owner document is already durably acknowledged.  A
                # profile/AI enrichment outage must not misreport that write as
                # unsaved; ArrayUnion makes the side effect safe to reconcile.
                print(f"[UserData] AI profile update failed for {uid}: {side_effect_error}")
        return _save_result(
            uid=uid,
            operation_id=resolved_operation_id,
            status="saved",
            durable=True,
            receipt=itinerary_data["receipt"],
        )
    except Exception as e:
        print(f"[UserData] Error saving itinerary for {uid}: {e}")
        return _save_result(
            uid=uid,
            operation_id=resolved_operation_id,
            status="unsaved",
            durable=False,
            error="PERSISTENCE_WRITE_FAILED",
            detail=str(e),
        )


async def get_user_itineraries(uid: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Get user's saved itineraries."""
    db = get_db()
    if not db:
        return []
    try:
        col_ref = db.collection("users").document(uid).collection("itineraries")
        query = col_ref.order_by("createdAt", direction="DESCENDING").limit(max_results)
        docs = await asyncio.to_thread(lambda: list(query.stream()))
        return [{"id": doc.id, **(doc.to_dict() or {})} for doc in docs]
    except Exception as e:
        print(f"[UserData] Error getting itineraries for {uid}: {e}")
        return []


# ────────────────────────────────────────────────────────────────────────────
# User Profile
# Path: users/{uid}
# ────────────────────────────────────────────────────────────────────────────

async def get_user_profile(uid: str) -> Optional[Dict[str, Any]]:
    """Get basic user profile."""
    db = get_db()
    if not db:
        return None
    try:
        doc = await asyncio.to_thread(db.collection("users").document(uid).get)
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"[UserData] Error getting profile for {uid}: {e}")
        return None


# ────────────────────────────────────────────────────────────────────────────
# Utility: Get Full User Context (for AI engines)
# ────────────────────────────────────────────────────────────────────────────

async def get_full_user_context(uid: str) -> Dict[str, Any]:
    """
    Build a complete user context for AI engines by merging profile,
    preferences, and AI profile data from Firestore.
    Returns a dict that can be directly fed into the recommendation and
    itinerary engines for maximum personalization.
    """
    profile, prefs, ai_profile = await asyncio.gather(
        get_user_profile(uid),
        get_user_preferences(uid),
        get_ai_profile(uid),
    )

    return {
        "uid": uid,
        "displayName": (profile or {}).get("displayName"),
        "totalTrips": (profile or {}).get("totalTrips", 0),
        # Preferences
        "travelStyle": (prefs or {}).get("travelStyle"),
        "preferredGroup": (prefs or {}).get("preferredGroup"),
        "interests": (prefs or {}).get("interests", []),
        "dietaryPreferences": (prefs or {}).get("dietaryPreferences", []),
        "homeCity": (prefs or {}).get("homeCity"),
        # AI profile
        "tasteVector": (ai_profile or {}).get("tasteVector", []),
        "browsingSignals": (ai_profile or {}).get("browsingSignals", {}),
        "pastDestinations": (ai_profile or {}).get("pastDestinations", []),
        "ai_profile": ai_profile,
    }
