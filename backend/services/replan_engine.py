import uuid
import datetime
import math
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from services.feasibility_validator import validate_itinerary_feasibility

class ReplanAction(BaseModel):
    actionType: str # KEEP, REMOVE, MOVE_TO_LATER_DAY, SAVE_FOR_LATER, REPLACE, END_DAY_EARLY
    activityId: Optional[str] = None
    rationale: str
    replacementActivity: Optional[Dict[str, Any]] = None
    targetDate: Optional[str] = None

class ProposedChange(BaseModel):
    proposalId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tripId: str
    baseRevisionId: str
    reason: str
    affectedDate: str
    summary: str
    actions: List[ReplanAction] = Field(default_factory=list)
    updatedTimeline: List[Dict[str, Any]] = Field(default_factory=list)
    updatedTransfers: List[Dict[str, Any]] = Field(default_factory=list)
    preservedBookings: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    impact: Dict[str, Any] = Field(default_factory=dict)
    generationMetadata: Dict[str, Any] = Field(default_factory=dict)

def _get_activity_class(act: dict, form: dict) -> str:
    title = act.get("name", act.get("title", "")).lower()
    cat = act.get("category", "").lower()
    
    if "booking" in act or act.get("isBooked", False):
        return "FIXED_HARD"
    if "reservation" in title or "ticket" in title or "flight" in title or "train" in title:
        return "FIXED_HARD"
        
    must_dos = form.get("mustDo", []) if form else []
    act_id = act.get("id") or act.get("placeId")
    if act_id in must_dos or title in [m.lower() for m in must_dos] or act.get("isMustDo", False):
        return "PROTECTED_MOVABLE"
        
    return "SOFT"

def _find_hotel_anchor(trip: dict) -> Optional[Dict[str, float]]:
    # Canonical accommodation/stay coordinates
    acc = trip.get("accommodation", {})
    acc_lat = acc.get("lat")
    acc_lng = acc.get("lng")
    if acc_lat and acc_lng:
        return {"lat": float(acc_lat), "lng": float(acc_lng)}
    
    # Grounded itinerary accommodation activity
    if trip.get("dayPlans"):
        day1 = trip["dayPlans"][0]
        for act in day1.get("activities", []):
            t = act.get("type", "").lower()
            name = act.get("name", act.get("title", "")).lower()
            if t == "hotel" or "check in" in name or "hotel" in name:
                lat = act.get("lat")
                lng = act.get("lng")
                if lat and lng:
                    return {"lat": float(lat), "lng": float(lng)}
    return None

def _can_fit_in_day(act: dict, day_plan: dict) -> bool:
    # Use feasibility validation safely instead of < 5 rule.
    # In a full impl, we'd inject it and run validate_itinerary_feasibility.
    # For now, we simulate a robust check based on time windows and duration.
    acts = day_plan.get("activities", [])
    total_dur_hrs = sum(a.get("durationMins", 60) for a in acts) / 60.0
    act_dur_hrs = act.get("durationMins", 60) / 60.0
    
    # Simple robust rule: If target day already has > 6 hours of activities or booking conflicts, reject.
    if total_dur_hrs + act_dur_hrs > 6.5:
        return False
        
    # Check if a fixed_hard booking exists and prevents insertion
    for a in acts:
        if a.get("isBooked", False):
            # very simplistic logic: assume conflict if > 3 activities plus a booking
            if len(acts) >= 3:
                return False
    return True

def generate_replan_proposal(
    trip: dict,
    dest_data: dict,
    current_day_idx: int,
    current_time: str,
    reason: str,
    completed_activity_ids: List[str],
    skipped_activity_ids: List[str],
    location: Optional[Dict[str, float]] = None,
    destinationTimezone: str = "UTC",
    baseRevisionId: str = None
) -> ProposedChange:
    
    trip_id = trip.get("id", trip.get("uuid", "unknown"))
    revisions = trip.get("revisions", [])
    current_base = revisions[-1].get("revisionId") if revisions else "init"
    
    base_revision_to_use = baseRevisionId if baseRevisionId else current_base
    
    day_plans = trip.get("dayPlans", [])
    if current_day_idx >= len(day_plans):
        current_day_idx = len(day_plans) - 1
        
    day = day_plans[current_day_idx]
    activities = day.get("activities", [])
    form = trip.get("form", {})
    
    actions = []
    preserved_bookings = []
    updated_timeline = []
    
    hotel_anchor = _find_hotel_anchor(trip)
    
    if reason == "I_AM_TIRED":
        activities_removed = 0
        activities_moved = 0
        
        for act in activities:
            act_id = act.get("id") or act.get("placeId") or act.get("title")
            title = act.get("name", act.get("title", ""))
            
            if act_id in completed_activity_ids or act_id in skipped_activity_ids:
                updated_timeline.append(act)
                continue
                
            ac_class = _get_activity_class(act, form)
            
            if ac_class == "FIXED_HARD":
                preserved_bookings.append(title)
                actions.append(ReplanAction(
                    actionType="KEEP",
                    activityId=act_id,
                    rationale=f"Kept confirmed reservation: {title}"
                ))
                updated_timeline.append(act)
                
            elif ac_class == "PROTECTED_MOVABLE":
                moved = False
                if current_day_idx + 1 < len(day_plans):
                    target_day = day_plans[current_day_idx + 1]
                    if _can_fit_in_day(act, target_day):
                        actions.append(ReplanAction(
                            actionType="MOVE_TO_LATER_DAY",
                            activityId=act_id,
                            rationale=f"Moved important stop {title} to tomorrow.",
                            targetDate=f"Day {target_day.get('dayNumber', current_day_idx + 2)}"
                        ))
                        activities_moved += 1
                        moved = True
                
                if not moved:
                    actions.append(ReplanAction(
                        actionType="SAVE_FOR_LATER",
                        activityId=act_id,
                        rationale=f"Saved priority stop for later due to lack of time: {title}."
                    ))
                    
            elif ac_class == "SOFT":
                actions.append(ReplanAction(
                    actionType="REMOVE",
                    activityId=act_id,
                    rationale=f"Removed optional stop {title} to simplify your day."
                ))
                activities_removed += 1
                
        if not [a for a in actions if a.actionType == "KEEP" and a.activityId not in completed_activity_ids]:
            actions.append(ReplanAction(
                actionType="END_DAY_EARLY",
                activityId=None,
                rationale="Ended the day early to rest."
            ))
            
        summary = "Naviigo protected your confirmed bookings and priority stops, and removed optional sightseeing to give you time to rest."
        
        impact = {
            "activitiesRemoved": activities_removed,
            "activitiesMoved": activities_moved,
            "endTimeBefore": None,
            "endTimeAfter": None,
            "travelReducedMinutes": None
        }
        
    else:
        for act in activities:
            act_id = act.get("id") or act.get("placeId") or act.get("title")
            actions.append(ReplanAction(
                actionType="KEEP",
                activityId=act_id,
                rationale="Default keep"
            ))
            updated_timeline.append(act)
            
        summary = f"Replanning requested for: {reason}"
        impact = {}

    return ProposedChange(
        tripId=trip_id,
        baseRevisionId=base_revision_to_use,
        reason=reason,
        affectedDate=f"Day {day.get('dayNumber', current_day_idx + 1)}",
        summary=summary,
        actions=actions,
        updatedTimeline=updated_timeline,
        preservedBookings=preserved_bookings,
        impact=impact,
        generationMetadata={"model": "v1_tired", "destinationTimezone": destinationTimezone}
    )
