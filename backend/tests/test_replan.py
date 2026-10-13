from copy import deepcopy

import pytest
from pydantic import ValidationError

from services.replan_engine import (
    ActivityIdentityAmbiguousError,
    ReplanAction,
    ReplanValidationError,
    generate_replan_proposal,
)


def _activity(activity_id=None, name="Activity", **extra):
    activity = {"name": name, "durationMins": 60, **extra}
    if activity_id is not None:
        activity["activityId"] = activity_id
    return activity


def _trip(day_plans, **extra):
    return {
        "id": "trip_123",
        "revisions": [{"revisionId": "rev_latest"}],
        "dayPlans": day_plans,
        **extra,
    }


def _proposal(trip, **overrides):
    args = {
        "trip": trip,
        "dest_data": {},
        "current_day_idx": 0,
        "current_time": "15:00",
        "reason": "I_AM_TIRED",
        "completed_activity_ids": [],
        "skipped_activity_ids": [],
        "baseRevisionId": "rev_0",
    }
    args.update(overrides)
    return generate_replan_proposal(**args)


def test_replan_preserves_bookings_and_uses_stable_activity_ids():
    trip = _trip(
        [
            {
                "dayNumber": 1,
                "activities": [
                    _activity("act_optional", "Sightseeing", placeId="place-1"),
                    _activity(
                        "act_booking",
                        "Dinner Reservation",
                        isBooked=True,
                        booking={"confirmation": "ABC"},
                    ),
                ],
            }
        ]
    )
    before = deepcopy(trip)

    proposal = _proposal(trip)
    actions = {action.activityId: action.actionType for action in proposal.actions if action.activityId}

    assert proposal.baseRevisionId == "rev_0"
    assert actions == {"act_optional": "REMOVE", "act_booking": "KEEP"}
    assert [activity["activityId"] for activity in proposal.updatedTimeline] == ["act_booking"]
    assert proposal.preservedBookings == ["Dinner Reservation"]
    assert trip == before

    # The proposal owns its timeline data and cannot mutate the itinerary read.
    proposal.updatedTimeline[0]["name"] = "changed in proposal"
    assert trip["dayPlans"][0]["activities"][1]["name"] == "Dinner Reservation"


def test_completed_and_skipped_activities_are_emitted_as_keep_actions():
    trip = _trip(
        [
            {
                "dayNumber": 4,
                "activities": [
                    _activity("done", "Completed stop"),
                    _activity("skipped", "Skipped stop"),
                    _activity("optional", "Optional stop"),
                ],
            }
        ]
    )

    proposal = _proposal(
        trip,
        completed_activity_ids=["done"],
        skipped_activity_ids=["skipped"],
    )
    actions = {action.activityId: action for action in proposal.actions if action.activityId}

    assert actions["done"].actionType == "KEEP"
    assert "completed" in actions["done"].rationale
    assert actions["skipped"].actionType == "KEEP"
    assert "skipped" in actions["skipped"].rationale
    assert actions["optional"].actionType == "REMOVE"
    assert {activity["activityId"] for activity in proposal.updatedTimeline} == {"done", "skipped"}


def test_protected_stop_moves_to_actual_non_sequential_day_number():
    trip = _trip(
        [
            {
                "dayNumber": 5,
                "activities": [
                    _activity("optional", "Random Park"),
                    _activity("must_do", "Must Do Museum"),
                ],
            },
            {
                "dayNumber": 9,
                "activities": [_activity("future", "Something else")],
            },
        ],
        form={"mustDo": ["must_do"]},
    )

    proposal = _proposal(trip, current_day_number=5, baseRevisionId="rev_3")
    move = next(action for action in proposal.actions if action.activityId == "must_do")

    assert proposal.affectedDate == "Day 5"
    assert proposal.baseRevisionId == "rev_3"
    assert move.actionType == "MOVE_TO_LATER_DAY"
    assert move.targetDate == "Day 9"
    assert move.targetDate != "Day 2"
    assert any(activity["activityId"] == "must_do" for activity in proposal.updatedTimeline)


def test_frozen_current_day_number_argument_selects_display_day_without_index():
    trip = _trip(
        [{"dayNumber": 9, "activities": [_activity("optional", "A stop")]}]
    )

    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[],
        baseRevisionId="rev_0",
        currentDayNumber=9,
    )

    assert proposal.affectedDate == "Day 9"


def test_unique_legacy_name_is_resolved_without_using_place_id():
    trip = _trip(
        [
            {
                "dayNumber": 1,
                "activities": [
                    {"title": "Legacy Museum", "placeId": "same-place", "durationMins": 60},
                ],
            }
        ]
    )

    proposal = _proposal(trip, completed_activity_ids=["Legacy Museum"])

    assert proposal.actions[0].activityId == "Legacy Museum"
    assert proposal.actions[0].actionType == "KEEP"
    assert proposal.actions[0].activityId != "same-place"


def test_ambiguous_legacy_name_fails_closed():
    trip = _trip(
        [
            {"dayNumber": 1, "activities": [{"name": "Repeated stop"}]},
            {"dayNumber": 3, "activities": [{"name": "Repeated stop"}]},
        ]
    )

    with pytest.raises(ActivityIdentityAmbiguousError) as error:
        _proposal(trip)

    assert error.value.code == "ACTIVITY_IDENTITY_AMBIGUOUS"
    assert "Repeated stop".casefold() in str(error.value).casefold()


def test_repeated_titles_with_stable_ids_are_not_ambiguous():
    trip = _trip(
        [
            {
                "dayNumber": 1,
                "activities": [_activity("visit-a", "Same place")],
            },
            {
                "dayNumber": 7,
                "activities": [_activity("visit-b", "Same place")],
            },
        ]
    )

    proposal = _proposal(trip)

    assert proposal.actions[0].activityId == "visit-a"
    assert proposal.actions[0].actionType == "REMOVE"


def test_invalid_reason_base_revision_and_day_bounds_are_rejected():
    trip = _trip([{"dayNumber": 1, "activities": [_activity("a")] }])

    with pytest.raises(ReplanValidationError, match="unsupported replan reason"):
        _proposal(trip, reason="RAIN")
    with pytest.raises(ReplanValidationError, match="baseRevisionId is required"):
        _proposal(trip, baseRevisionId=None)
    with pytest.raises(ReplanValidationError, match="day bounds"):
        _proposal(trip, current_day_idx=4)
    with pytest.raises(ReplanValidationError, match="day bounds"):
        _proposal(trip, current_day_number=2)


def test_completed_and_skipped_overlap_is_rejected():
    trip = _trip([{"dayNumber": 1, "activities": [_activity("a")] }])

    with pytest.raises(ReplanValidationError, match="both completed and skipped"):
        _proposal(trip, completed_activity_ids=["a"], skipped_activity_ids=["a"])


def test_full_target_day_keeps_protected_stop_with_warning():
    trip = _trip(
        [
            {"dayNumber": 1, "activities": [_activity("must", "Must Do")]},
            {
                "dayNumber": 2,
                "activities": [
                    _activity("a", "One", durationMins=180),
                    _activity("b", "Two", durationMins=180),
                    _activity("c", "Three", durationMins=180),
                ],
            },
        ],
        form={"mustDo": ["must"]},
    )

    proposal = _proposal(trip)

    assert next(action for action in proposal.actions if action.activityId == "must").actionType == "KEEP"
    assert not any(action.actionType in {"MOVE_TO_LATER_DAY", "SAVE_FOR_LATER", "END_DAY_EARLY"} for action in proposal.actions)
    assert proposal.warnings == ["Must Do remains on Day 1; no later day can safely fit this priority stop."]


def test_replan_action_rejects_unsupported_or_unbounded_shapes():
    with pytest.raises(ValidationError):
        ReplanAction(actionType="DROP_EVERYTHING", activityId="a", rationale="bad")
    with pytest.raises(ValidationError):
        ReplanAction(actionType="MOVE_TO_LATER_DAY", activityId="a", rationale="bad", targetDate="Day 0")
    with pytest.raises(ValidationError):
        ReplanAction(actionType="REPLACE", activityId="a", rationale="bad", replacementActivity={"name": "new"})


def test_protected_activity_fields_are_carried_by_original_timeline():
    booking = _activity(
        "booking",
        "Museum booking",
        isBooked=True,
        booking={"confirmationCode": "keep-me", "price": 100},
        provider={"name": "provider", "id": None},
    )
    trip = _trip([{"dayNumber": 1, "activities": [booking]}])

    proposal = _proposal(trip)

    assert proposal.updatedTimeline == [booking]
    assert proposal.updatedTimeline[0]["booking"] == booking["booking"]
    assert proposal.updatedTimeline[0]["provider"] == booking["provider"]
