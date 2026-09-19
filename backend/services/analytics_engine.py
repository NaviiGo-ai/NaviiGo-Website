import asyncio
from datetime import datetime
from typing import List, Dict, Any
from services.firebase_client import get_db
from firebase_admin import firestore
from services.personalization_config import EVENT_WEIGHTS, SKIP_PENALTIES


async def process_analytics_events(uid: str, events: List[Dict[str, Any]]):
    db = get_db()
    if not db: return

    # 1. Fetch current ai_profile to check for reset epoch
    profile_ref = db.collection("users").document(uid).collection("ai_profile").document("main")
    profile_doc = await asyncio.to_thread(profile_ref.get)
    ai_profile = profile_doc.to_dict() if profile_doc.exists else {}
    
    reset_epoch = ai_profile.get("personalizationResetAt", None)

    # Prepare batch for idempotent storage and profile updates
    batch = db.batch()
    new_affinities = ai_profile.get("behavioralAffinities", {})
    visited_ids = set(ai_profile.get("visitedPlaceIds", []))
    dismissed_ids = set(ai_profile.get("dismissedPlaceIds", []))
    
    events_ref = db.collection("users").document(uid).collection("analytics_events")
    
    for ev in events:
        event_id = ev.get("eventId")
        if not event_id: continue
        
# 1. Save raw event idemptotically
        ev_doc_ref = events_ref.document(event_id)
        ev_snap = await asyncio.to_thread(ev_doc_ref.get)
        if ev_snap.exists:
            # Already processed this event ID!
            continue
            
        batch.set(ev_doc_ref, ev, merge=True)
        
        # Check if event is before reset epoch
        occurred_at = ev.get("occurredAt")
        if reset_epoch and occurred_at and occurred_at < reset_epoch:
            continue
            
        event_type = ev.get("eventType")
        place_id = ev.get("placeId")
        
        # 2. Update strict visit/dismissed evidence
        if event_type in ["ACTIVITY_CHECKED_IN", "ACTIVITY_COMPLETED", "POST_TRIP_PLACE_CONFIRMED_VISITED"]:
            if place_id: visited_ids.add(place_id)
        elif event_type == "RECOMMENDATION_DISMISSED":
            if place_id: dismissed_ids.add(place_id)
            
        # 3. Update behavior affinities
        weight = EVENT_WEIGHTS.get(event_type, 0)
        if event_type == "ACTIVITY_SKIPPED":
            skip_reason = (ev.get("metadata") or {}).get("skipReason", "")
            weight = SKIP_PENALTIES.get(skip_reason, 0)
            
        if place_id and weight != 0:
            dest_id = ev.get("destinationId", "goa")
            from services.destination_cache import get_destination_data
            dest_data = await get_destination_data(dest_id)
            
            # Find category
            category = "unknown"
            if dest_data:
                for pool in ["highlights", "restaurants"]:
                    for place in dest_data.get(pool, []):
                        nm = place.get("name", "").replace(" ", "_").lower()
                        if place.get("id") == place_id or nm == place_id or nm.replace("of_", "") == place_id:
                            category = place.get("category", "unknown")
                            break
                    if category != "unknown":
                        break
            
            if category != "unknown":
                current_weight = new_affinities.get(category, 0)
                new_affinities[category] = current_weight + weight

    # Ensure bounded arrays (keep last 200 visited/dismissed to prevent doc size bloat)
    bounded_visited = list(visited_ids)[-200:]
    bounded_dismissed = list(dismissed_ids)[-200:]
    
    updates = {
        "visitedPlaceIds": bounded_visited,
        "dismissedPlaceIds": bounded_dismissed,
        "behavioralAffinities": new_affinities,
        "scoringVersion": "1.1",
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    
    batch.set(profile_ref, updates, merge=True)
    await asyncio.to_thread(batch.commit)

async def reset_user_personalization(uid: str):
    db = get_db()
    if not db: return
    ref = db.collection("users").document(uid).collection("ai_profile").document("main")
    await asyncio.to_thread(ref.set, {
        "personalizationResetAt": datetime.utcnow().isoformat(),
        "behavioralAffinities": {},
        "visitedPlaceIds": [],
        "dismissedPlaceIds": [],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)
