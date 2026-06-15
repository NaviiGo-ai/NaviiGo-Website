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

from datetime import datetime
from typing import Optional, Dict, Any, List
from services.firebase_client import get_db, is_firebase_configured
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


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
        doc = db.collection("users").document(uid).collection("preferences").document("main").get()
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
        doc = ref.get()
        if doc.exists:
            ref.update({**prefs, "updatedAt": SERVER_TIMESTAMP})
        else:
            ref.set({
                "travelStyle": None,
                "preferredGroup": None,
                "interests": [],
                "dietaryPreferences": [],
                "accessibilityNeeds": [],
                "homeCity": None,
                "recentSearches": [],
                **prefs,
                "updatedAt": SERVER_TIMESTAMP,
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
        doc = db.collection("users").document(uid).collection("ai_profile").document("main").get()
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
        doc = ref.get()
        if doc.exists:
            ref.update({**data, "updatedAt": SERVER_TIMESTAMP})
        else:
            ref.set({
                "tasteVector": [],
                "browsingSignals": {},
                "pastDestinations": [],
                "lastRecommendations": [],
                **data,
                "updatedAt": SERVER_TIMESTAMP,
            })
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
        
        # Merge clicked categories (union)
        existing_cats = set(current_signals.get("clickedCategories", []))
        new_cats = set(signals.get("clickedCategories", []))
        merged_cats = list(existing_cats | new_cats)

        # Merge viewed destinations (union, last 20)
        existing_viewed = current_signals.get("viewedDestinations", [])
        new_viewed = signals.get("viewedDestinations", [])
        merged_viewed = list(dict.fromkeys(new_viewed + existing_viewed))[:20]

        # Merge time on city (sum)
        existing_time = current_signals.get("timeOnCity", {})
        new_time = signals.get("timeOnCity", {})
        merged_time = {**existing_time}
        for city, t in new_time.items():
            merged_time[city] = merged_time.get(city, 0) + t

        # Merge deep dive vibes (replace per dest)
        existing_vibes = current_signals.get("deepDiveVibes", [])
        new_vibes = signals.get("deepDiveVibes", [])
        vibe_map = {v["dest"]: v for v in existing_vibes}
        for v in new_vibes:
            vibe_map[v["dest"]] = v
        merged_vibes = list(vibe_map.values())

        merged = {
            "clickedCategories": merged_cats,
            "viewedDestinations": merged_viewed,
            "timeOnCity": merged_time,
            "deepDiveVibes": merged_vibes,
        }

        await update_ai_profile(uid, {"browsingSignals": merged})
    except Exception as e:
        print(f"[UserData] Error merging browsing signals for {uid}: {e}")


async def add_past_destination(uid: str, dest_id: str):
    """Add a destination to the user's trip history."""
    db = get_db()
    if not db:
        return
    try:
        existing = await get_ai_profile(uid)
        past = (existing or {}).get("pastDestinations", [])
        if dest_id not in past:
            past = [dest_id] + past[:19]  # Keep last 20
        await update_ai_profile(uid, {"pastDestinations": past})
    except Exception as e:
        print(f"[UserData] Error adding past destination for {uid}: {e}")


# ────────────────────────────────────────────────────────────────────────────
# Saved Itineraries (reads/writes the SAME collection as the frontend)
# Path: users/{uid}/itineraries/{itineraryId}
# ────────────────────────────────────────────────────────────────────────────

async def save_itinerary(uid: str, data: Dict[str, Any]) -> Optional[str]:
    """Save a generated itinerary to the user's Firestore collection."""
    db = get_db()
    if not db:
        return None
    try:
        col_ref = db.collection("users").document(uid).collection("itineraries")
        doc_ref = col_ref.add({
            "destId": data.get("destination", ""),
            "destName": data.get("destName", ""),
            "form": data.get("form", {}),
            "generatedData": data.get("generatedData"),
            "isActive": False,
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        })
        # Update user trip count
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        if user_doc.exists:
            from google.cloud.firestore_v1 import transforms
            user_ref.update({"totalTrips": transforms.Increment(1)})

        # Track destination in AI profile
        await add_past_destination(uid, data.get("destination", ""))
        
        return doc_ref[1].id
    except Exception as e:
        print(f"[UserData] Error saving itinerary for {uid}: {e}")
        return None


async def get_user_itineraries(uid: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Get user's saved itineraries."""
    db = get_db()
    if not db:
        return []
    try:
        col_ref = db.collection("users").document(uid).collection("itineraries")
        query = col_ref.order_by("createdAt", direction="DESCENDING").limit(max_results)
        docs = query.stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
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
        doc = db.collection("users").document(uid).get()
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
    profile = await get_user_profile(uid)
    prefs = await get_user_preferences(uid)
    ai_profile = await get_ai_profile(uid)

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
    }
