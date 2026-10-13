"""Pure proposal generation for Phase 6 itinerary replanning.

The router owns authentication, persistence, and acceptance.  This module only
validates the proposal inputs and builds a server-owned proposal from the
itinerary snapshot it was given.  In particular, it never mutates the input
itinerary and it never turns a title, place ID, or array position into a new
activity identity.
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
import re
import uuid
from typing import Any, Dict, List, Literal, Optional, Sequence, Set, Tuple

from pydantic import BaseModel, Field, model_validator


SUPPORTED_REASON = "I_AM_TIRED"
SUPPORTED_ACTIONS = frozenset(
    {
        "KEEP",
        "REMOVE",
        "MOVE_TO_LATER_DAY",
        "SAVE_FOR_LATER",
        "REPLACE",
        "END_DAY_EARLY",
    }
)
_DAY_LABEL = re.compile(r"^Day ([1-9][0-9]*)$")


class ReplanValidationError(ValueError):
    """A request cannot produce a safe Phase 6 proposal."""

    code = "REPLAN_VALIDATION_ERROR"
    status_code = 422

    def __init__(self, message: str):
        self.message = message
        super().__init__(f"{self.code}: {message}")


class ActivityIdentityAmbiguousError(ReplanValidationError):
    """A legacy activity cannot be addressed without guessing."""

    code = "ACTIVITY_IDENTITY_AMBIGUOUS"
    status_code = 409


class ReplanAction(BaseModel):
    actionType: Literal[
        "KEEP",
        "REMOVE",
        "MOVE_TO_LATER_DAY",
        "SAVE_FOR_LATER",
        "REPLACE",
        "END_DAY_EARLY",
    ]
    activityId: Optional[str] = None
    rationale: str
    replacementActivity: Optional[Dict[str, Any]] = None
    targetDate: Optional[str] = None

    @model_validator(mode="after")
    def validate_shape(self) -> "ReplanAction":
        needs_activity = self.actionType != "END_DAY_EARLY"
        if needs_activity and (not isinstance(self.activityId, str) or not self.activityId.strip()):
            raise ValueError(f"{self.actionType} requires activityId")
        if self.actionType == "END_DAY_EARLY" and self.activityId is not None:
            raise ValueError("END_DAY_EARLY cannot target an activity")
        if self.actionType == "MOVE_TO_LATER_DAY":
            if not isinstance(self.targetDate, str) or _DAY_LABEL.fullmatch(self.targetDate) is None:
                raise ValueError("MOVE_TO_LATER_DAY requires targetDate like 'Day 9'")
        elif self.targetDate is not None:
            raise ValueError(f"{self.actionType} cannot include targetDate")
        if self.actionType == "REPLACE":
            replacement = self.replacementActivity
            if not isinstance(replacement, dict):
                raise ValueError("REPLACE requires replacementActivity")
            replacement_id = replacement.get("activityId")
            if not isinstance(replacement_id, str) or not replacement_id.strip():
                raise ValueError("replacementActivity requires a stable activityId")
        elif self.replacementActivity is not None:
            raise ValueError(f"{self.actionType} cannot include replacementActivity")
        return self


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


@dataclass(frozen=True)
class _ActivityRef:
    """An activity and the safe identity by which proposal actions address it."""

    activity_id: str
    day_position: int
    day_number: int
    activity: Dict[str, Any]
    legacy_name: bool = False


def _require_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ReplanValidationError(f"{field_name} must be a non-empty string")
    return value.strip()


def _activity_title(activity: Dict[str, Any]) -> str:
    title = activity.get("name")
    if not isinstance(title, str) or not title.strip():
        title = activity.get("title")
    return _require_text(title, "activity name/title")


def _normalise_name(value: str) -> str:
    return " ".join(value.casefold().split())


def _day_number(day: Dict[str, Any], position: int) -> int:
    raw = day.get("dayNumber", day.get("day"))
    # Position is only a compatibility fallback for very old documents that
    # never stored a display day.  Actions always use the resulting day value,
    # never a list index.
    if raw is None:
        raw = position + 1
    if isinstance(raw, bool):
        raise ReplanValidationError(f"dayPlans[{position}].dayNumber must be a positive integer")
    if isinstance(raw, int):
        number = raw
    elif isinstance(raw, str) and raw.strip().isdigit():
        number = int(raw.strip())
    else:
        raise ReplanValidationError(f"dayPlans[{position}].dayNumber must be a positive integer")
    if number < 1:
        raise ReplanValidationError(f"dayPlans[{position}].dayNumber must be at least 1")
    return number


def _validate_day_plans(trip: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[int]]:
    day_plans = trip.get("dayPlans")
    if not isinstance(day_plans, list) or not day_plans:
        raise ReplanValidationError("trip must contain at least one day plan")

    day_numbers: List[int] = []
    for position, day in enumerate(day_plans):
        if not isinstance(day, dict):
            raise ReplanValidationError(f"dayPlans[{position}] must be an object")
        day_numbers.append(_day_number(day, position))
    if len(day_numbers) != len(set(day_numbers)):
        raise ReplanValidationError("dayPlans must have unique day numbers")
    return day_plans, day_numbers


def _preferred_identity(activity: Dict[str, Any]) -> Tuple[Optional[str], bool]:
    """Return an existing identity; never manufacture one.

    ``activityId`` is the Phase 6 identity.  ``id`` is accepted only as a
    legacy identity so existing documents can be replanned during migration.
    A place ID is deliberately not considered: one place can occur more than
    once in an itinerary.
    """

    activity_id = activity.get("activityId")
    if activity_id is not None and (not isinstance(activity_id, str) or not activity_id.strip()):
        raise ReplanValidationError("activityId must be a non-empty string when present")
    if isinstance(activity_id, str) and activity_id.strip():
        return activity_id.strip(), False

    legacy_id = activity.get("id")
    if legacy_id is not None and (not isinstance(legacy_id, str) or not legacy_id.strip()):
        raise ReplanValidationError("legacy activity id must be a non-empty string when present")
    if isinstance(legacy_id, str) and legacy_id.strip():
        return legacy_id.strip(), False

    return _activity_title(activity), True


def _build_activity_index(
    day_plans: Sequence[Dict[str, Any]],
    day_numbers: Sequence[int],
) -> Tuple[List[_ActivityRef], Dict[str, _ActivityRef]]:
    refs: List[_ActivityRef] = []
    by_id: Dict[str, List[_ActivityRef]] = {}
    by_name: Dict[str, List[_ActivityRef]] = {}

    for day_position, day in enumerate(day_plans):
        activities = day.get("activities", [])
        if not isinstance(activities, list):
            raise ReplanValidationError(f"dayPlans[{day_position}].activities must be a list")
        for activity in activities:
            if not isinstance(activity, dict):
                raise ReplanValidationError("every activity must be an object")
            activity_id, legacy_name = _preferred_identity(activity)
            ref = _ActivityRef(
                activity_id=activity_id,
                day_position=day_position,
                day_number=day_numbers[day_position],
                activity=activity,
                legacy_name=legacy_name,
            )
            refs.append(ref)
            by_id.setdefault(activity_id, []).append(ref)
            by_name.setdefault(_normalise_name(_activity_title(activity)), []).append(ref)

    for activity_id, matching in by_id.items():
        if len(matching) > 1:
            raise ActivityIdentityAmbiguousError(
                f"activity identity '{activity_id}' occurs more than once"
            )

    # A name-only occurrence can be addressed only if its title identifies one
    # occurrence across the whole itinerary.  Repeated title visits with real
    # activityIds are fine; they do not need a title-based fallback.
    for name, matching in by_name.items():
        if len(matching) > 1 and any(ref.legacy_name for ref in matching):
            raise ActivityIdentityAmbiguousError(
                f"legacy activity name '{name}' matches multiple occurrences"
            )

    resolved: Dict[str, _ActivityRef] = {}
    for ref in refs:
        if ref.activity_id in resolved:
            raise ActivityIdentityAmbiguousError(
                f"activity identity '{ref.activity_id}' is not unique"
            )
        resolved[ref.activity_id] = ref
    return refs, resolved


def _resolve_activity_id(
    value: Any,
    refs: Sequence[_ActivityRef],
    by_id: Dict[str, _ActivityRef],
) -> str:
    token = _require_text(value, "activity identity")
    direct = by_id.get(token)
    if direct is not None:
        return direct.activity_id

    matches = [
        ref
        for ref in refs
        if _normalise_name(_activity_title(ref.activity)) == _normalise_name(token)
    ]
    if len(matches) == 1:
        return matches[0].activity_id
    if len(matches) > 1:
        raise ActivityIdentityAmbiguousError(
            f"legacy activity name '{token}' matches multiple occurrences"
        )
    raise ReplanValidationError(f"activity identity '{token}' was not found")


def _resolve_request_ids(
    values: Optional[Sequence[str]],
    field_name: str,
    refs: Sequence[_ActivityRef],
    by_id: Dict[str, _ActivityRef],
) -> Set[str]:
    if values is None:
        return set()
    if not isinstance(values, (list, tuple, set)):
        raise ReplanValidationError(f"{field_name} must be a list of activity identities")
    resolved: Set[str] = set()
    for value in values:
        try:
            resolved.add(_resolve_activity_id(value, refs, by_id))
        except ReplanValidationError as error:
            error_type = type(error)
            raise error_type(f"{field_name}: {error.message}") from error
    return resolved


def _must_do_tokens(form: Optional[Dict[str, Any]]) -> Tuple[Set[str], Set[str]]:
    ids: Set[str] = set()
    names: Set[str] = set()
    if not isinstance(form, dict):
        return ids, names
    must_dos = form.get("mustDo")
    if must_dos is None and isinstance(form.get("input"), dict):
        must_dos = form["input"].get("mustDo", [])
    must_dos = must_dos or []
    if not isinstance(must_dos, list):
        return ids, names
    for item in must_dos:
        if isinstance(item, str) and item.strip():
            ids.add(item.strip())
            names.add(_normalise_name(item))
        elif isinstance(item, dict):
            for key in ("activityId", "id"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    ids.add(value.strip())
            for key in ("name", "title"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    names.add(_normalise_name(value))
    return ids, names


def _get_activity_class(act: Dict[str, Any], form: Optional[Dict[str, Any]]) -> str:
    """Classify an activity without using a derived identity."""

    title = _activity_title(act)
    title_lower = title.casefold()
    act_type = str(act.get("type", "")).casefold()

    booking_fields = (
        "booking",
        "bookingId",
        "reservation",
        "reservationId",
        "ticket",
        "confirmationCode",
    )
    if act.get("isBooked") or any(act.get(key) not in (None, "", False, {}) for key in booking_fields):
        return "FIXED_HARD"
    if act_type in {"hotel", "transit", "transport", "flight", "train", "bus"}:
        return "FIXED_HARD"
    if act.get("isFreeDay") or title_lower == "free day":
        return "FIXED_HARD"
    if any(word in title_lower for word in ("reservation", "ticket", "flight", "train")):
        return "FIXED_HARD"

    must_do_ids, must_do_names = _must_do_tokens(form)
    stable_id = act.get("activityId") or act.get("id")
    if (
        act.get("isMustDo")
        or (isinstance(stable_id, str) and stable_id in must_do_ids)
        or _normalise_name(title) in must_do_names
    ):
        return "PROTECTED_MOVABLE"
    return "SOFT"


def _duration_minutes(activity: Dict[str, Any]) -> float:
    raw = activity.get("durationMins", 60)
    if raw is None:
        return 60.0
    if isinstance(raw, bool):
        raise ReplanValidationError("durationMins must be a finite non-negative number")
    try:
        value = float(raw)
    except (TypeError, ValueError) as error:
        raise ReplanValidationError("durationMins must be a finite non-negative number") from error
    if value < 0 or value != value or value in (float("inf"), float("-inf")):
        raise ReplanValidationError("durationMins must be a finite non-negative number")
    return value


def _can_fit_in_day(act: Dict[str, Any], day_plan: Dict[str, Any]) -> bool:
    """Conservatively determine whether a protected stop can move later."""

    activities = day_plan.get("activities", [])
    if not isinstance(activities, list):
        raise ReplanValidationError("target day activities must be a list")
    total_duration_hours = sum(_duration_minutes(item) for item in activities if isinstance(item, dict)) / 60.0
    activity_duration_hours = _duration_minutes(act) / 60.0
    if total_duration_hours + activity_duration_hours > 6.5:
        return False
    if any(isinstance(item, dict) and item.get("isBooked") for item in activities):
        if len(activities) >= 3:
            return False
    return True


def _select_current_day(
    day_numbers: Sequence[int],
    current_day_idx: Optional[int],
    current_day_number: Optional[int],
    current_day_number_alias: Optional[int],
) -> int:
    if current_day_number is not None and current_day_number_alias is not None:
        if current_day_number != current_day_number_alias:
            raise ReplanValidationError("current day number was supplied twice with different values")
    requested_day_number = current_day_number if current_day_number is not None else current_day_number_alias
    if requested_day_number is not None:
        if isinstance(requested_day_number, bool) or not isinstance(requested_day_number, int):
            raise ReplanValidationError("currentDayNumber must be a positive integer")
        if requested_day_number < 1 or requested_day_number not in day_numbers:
            raise ReplanValidationError("currentDayNumber is outside the itinerary day bounds")
        return list(day_numbers).index(requested_day_number)

    if isinstance(current_day_idx, bool) or not isinstance(current_day_idx, int):
        raise ReplanValidationError("current day index must be an integer")
    if 0 <= current_day_idx < len(day_numbers):
        return current_day_idx
    # A direct day-number fallback helps the existing route bridge a frozen
    # request while still selecting by the stored display identity when the
    # numeric value cannot be a list position.
    if current_day_idx in day_numbers:
        return list(day_numbers).index(current_day_idx)
    raise ReplanValidationError("current day index is outside the itinerary day bounds")


def _validate_generated_actions(
    actions: Sequence[ReplanAction],
    known_ids: Set[str],
    day_numbers: Set[int],
    current_day_number: int,
) -> None:
    for action in actions:
        if action.actionType == "END_DAY_EARLY":
            continue
        if action.activityId not in known_ids:
            raise ReplanValidationError("proposal action references an unknown activity identity")
        if action.actionType == "MOVE_TO_LATER_DAY":
            assert action.targetDate is not None
            target_number = int(_DAY_LABEL.fullmatch(action.targetDate).group(1))
            if target_number not in day_numbers or target_number == current_day_number:
                raise ReplanValidationError("proposal move target is outside the itinerary day bounds")


def generate_replan_proposal(
    trip: Dict[str, Any],
    dest_data: Dict[str, Any],
    current_day_idx: Optional[int] = None,
    current_time: str = "",
    reason: str = "",
    completed_activity_ids: Optional[List[str]] = None,
    skipped_activity_ids: Optional[List[str]] = None,
    location: Optional[Dict[str, float]] = None,
    destinationTimezone: str = "UTC",
    baseRevisionId: Optional[str] = None,
    current_day_number: Optional[int] = None,
    currentDayNumber: Optional[int] = None,
) -> ProposedChange:
    """Build a safe, server-owned replan proposal.

    ``current_day_idx`` remains the zero-based compatibility argument used by
    the existing route.  Contract callers can pass ``current_day_number`` (or
    its frozen camel-case spelling) to select the stored display day directly.
    Every generated action uses the resolved activity identity and every move
    uses the target plan's actual day number.
    """

    if not isinstance(trip, dict):
        raise ReplanValidationError("trip must be an object")
    if reason != SUPPORTED_REASON:
        raise ReplanValidationError(f"unsupported replan reason: {reason!r}")
    if not isinstance(baseRevisionId, str) or not baseRevisionId.strip():
        raise ReplanValidationError("baseRevisionId is required")
    if not isinstance(current_time, str) or not current_time.strip():
        raise ReplanValidationError("currentTime is required")

    day_plans, day_numbers = _validate_day_plans(trip)
    current_position = _select_current_day(
        day_numbers,
        current_day_idx,
        current_day_number,
        currentDayNumber,
    )
    refs, by_id = _build_activity_index(day_plans, day_numbers)
    completed_ids = _resolve_request_ids(
        completed_activity_ids,
        "completedActivityIds",
        refs,
        by_id,
    )
    skipped_ids = _resolve_request_ids(
        skipped_activity_ids,
        "skippedActivityIds",
        refs,
        by_id,
    )
    overlap = completed_ids & skipped_ids
    if overlap:
        raise ReplanValidationError("an activity cannot be both completed and skipped")

    trip_id = trip.get("id", trip.get("uuid", "unknown"))
    if not isinstance(trip_id, str) or not trip_id.strip():
        raise ReplanValidationError("trip id must be a non-empty string")

    current_day_number_value = day_numbers[current_position]
    current_refs = [ref for ref in refs if ref.day_position == current_position]
    form = trip.get("form") if isinstance(trip.get("form"), dict) else {}

    actions: List[ReplanAction] = []
    preserved_bookings: List[str] = []
    updated_timeline: List[Dict[str, Any]] = []
    warnings: List[str] = []
    activities_removed = 0
    activities_moved = 0
    has_active_keep = False

    for ref in current_refs:
        activity = ref.activity
        activity_id = ref.activity_id
        title = _activity_title(activity)

        # Completed/skipped state is authoritative client state.  KEEP actions
        # are emitted so the route's typed action application cannot drop these
        # activities during acceptance.
        if activity_id in completed_ids or activity_id in skipped_ids:
            state = "completed" if activity_id in completed_ids else "skipped"
            actions.append(
                ReplanAction(
                    actionType="KEEP",
                    activityId=activity_id,
                    rationale=f"Preserved {state} activity: {title}",
                )
            )
            updated_timeline.append(deepcopy(activity))
            continue

        activity_class = _get_activity_class(activity, form)
        if activity_class == "FIXED_HARD":
            preserved_bookings.append(title)
            actions.append(
                ReplanAction(
                    actionType="KEEP",
                    activityId=activity_id,
                    rationale=f"Kept protected logistics or reservation: {title}",
                )
            )
            updated_timeline.append(deepcopy(activity))
            has_active_keep = True
        elif activity_class == "PROTECTED_MOVABLE":
            # Keep the original occurrence in the review payload even when the
            # typed action moves or defers it.  Acceptance can then apply the
            # action against the authoritative itinerary occurrence instead of
            # rebuilding protected fields from a title-only action.
            updated_timeline.append(deepcopy(activity))
            moved = False
            if current_position + 1 < len(day_plans):
                target_position = current_position + 1
                target_day = day_plans[target_position]
                if _can_fit_in_day(activity, target_day):
                    actions.append(
                        ReplanAction(
                            actionType="MOVE_TO_LATER_DAY",
                            activityId=activity_id,
                            rationale=f"Moved important stop {title} to a later itinerary day.",
                            targetDate=f"Day {day_numbers[target_position]}",
                        )
                    )
                    activities_moved += 1
                    moved = True
            if not moved:
                # Phase 6 has no durable deferred-activity store. Keep the
                # protected occurrence instead of proposing an unacceptably
                # destructive SAVE_FOR_LATER action.
                actions.append(
                    ReplanAction(
                        actionType="KEEP",
                        activityId=activity_id,
                        rationale=f"Kept priority stop {title}; no later itinerary day can safely fit it.",
                    )
                )
                warnings.append(f"{title} remains on Day {current_day_number_value}; no later day can safely fit this priority stop.")
                has_active_keep = True
        else:
            actions.append(
                ReplanAction(
                    actionType="REMOVE",
                    activityId=activity_id,
                    rationale=f"Removed optional stop {title} to simplify your day.",
                )
            )
            activities_removed += 1

    if not has_active_keep:
        actions.append(
            ReplanAction(
                actionType="END_DAY_EARLY",
                rationale="Ended the day early to rest.",
            )
        )

    _validate_generated_actions(
        actions,
        set(by_id),
        set(day_numbers),
        current_day_number_value,
    )

    summary = (
        "Naviigo protected your completed, skipped, confirmed, and priority "
        "activities, and removed optional sightseeing to give you time to rest."
    )
    impact = {
        "activitiesRemoved": activities_removed,
        "activitiesMoved": activities_moved,
        "endTimeBefore": None,
        "endTimeAfter": None,
        "travelReducedMinutes": None,
    }

    return ProposedChange(
        tripId=trip_id,
        baseRevisionId=baseRevisionId.strip(),
        reason=reason,
        affectedDate=f"Day {current_day_number_value}",
        summary=summary,
        actions=actions,
        updatedTimeline=updated_timeline,
        preservedBookings=preserved_bookings,
        warnings=warnings,
        impact=impact,
        generationMetadata={"model": "v1_tired", "destinationTimezone": destinationTimezone},
    )
