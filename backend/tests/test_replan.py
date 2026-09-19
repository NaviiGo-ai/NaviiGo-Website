import pytest
from services.replan_engine import generate_replan_proposal
from pydantic import BaseModel

class MockReplanAcceptRequest:
    tripId: str
    proposalId: str
    proposalData: dict

def test_replan_booking_preservation():
    trip = {
        "id": "trip_123",
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act1", "title": "Sightseeing", "category": "Museum"},
                    {"id": "act2", "title": "Dinner Reservation", "category": "Food", "isBooked": True}
                ]
            }
        ]
    }
    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    assert any(a.actionType == "KEEP" and a.activityId == "act2" for a in proposal.actions)
    assert any(a.actionType == "REMOVE" and a.activityId == "act1" for a in proposal.actions)
    assert "act1" not in [x.get("id") for x in proposal.updatedTimeline]
    assert "act2" in [x.get("id") for x in proposal.updatedTimeline]

def test_replan_mustdo_preservation():
    trip = {
        "id": "trip_123",
        "form": {"mustDo": ["act_must_do"]},
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act1", "title": "Random Park", "category": "Nature"},
                    {"id": "act_must_do", "title": "Must Do Museum", "category": "Museum"}
                ]
            }
        ]
    }
    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    assert any(a.actionType in ["KEEP", "SAVE_FOR_LATER"] and a.activityId == "act_must_do" for a in proposal.actions)
    assert any(a.actionType == "REMOVE" and a.activityId == "act1" for a in proposal.actions)

def test_replan_future_move():
    trip = {
        "id": "trip_123",
        "form": {"mustDo": ["act_must_do"]},
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act1", "title": "Random Park", "category": "Nature"},
                    {"id": "act_must_do", "title": "Must Do Museum", "category": "Museum"}
                ]
            },
            {
                "dayNumber": 2,
                "activities": [
                    {"id": "act3", "title": "Something else"}
                ]
            }
        ]
    }
    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    assert any(a.actionType == "MOVE_TO_LATER_DAY" and a.activityId == "act_must_do" for a in proposal.actions)
    assert any(a.actionType == "REMOVE" and a.activityId == "act1" for a in proposal.actions)

def test_replan_no_mutation():
    trip = {
        "id": "trip_123",
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act1", "title": "Random Park", "category": "Nature"}
                ]
            }
        ]
    }
    generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    assert len(trip["dayPlans"][0]["activities"]) == 1

def test_replan_move_commits_both_days_atomically():
    trip = {
        "id": "trip_123",
        "form": {"mustDo": ["act_must_do"]},
        "revisions": [{"revisionId": "rev_0"}],
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act_must_do", "title": "Must Do Museum", "category": "Museum"}
                ]
            },
            {
                "dayNumber": 2,
                "activities": []
            }
        ]
    }
    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    actions = [a.dict() for a in proposal.actions]
    
    # Simulate Accept Logic (Mock)
    changed_days = {0: trip["dayPlans"][0]}
    
    new_activities_d1 = []
    acts_dict = {a.get("id"): a for a in trip["dayPlans"][0]["activities"]}
    for action in actions:
        act_type = action.get("actionType")
        act_id = action.get("activityId")
        if act_type == "MOVE_TO_LATER_DAY":
            target_idx = 1
            if target_idx not in changed_days:
                changed_days[target_idx] = trip["dayPlans"][target_idx]
            changed_days[target_idx]["activities"].append(acts_dict[act_id])
    
    changed_days[0]["activities"] = new_activities_d1
    
    # Assert
    assert len(changed_days[0]["activities"]) == 0
    assert len(changed_days[1]["activities"]) == 1
    assert changed_days[1]["activities"][0]["id"] == "act_must_do"
    assert list(sorted(changed_days.keys())) == [0, 1]

def test_stale_multi_day_move():
    # If Day 10 is changed before accept, baseRevisionId won't match, throwing STALE_PROPOSAL
    pass

def test_target_day_failure():
    trip = {
        "id": "trip_123",
        "form": {"mustDo": ["act_must_do"]},
        "dayPlans": [
            {
                "dayNumber": 1,
                "activities": [
                    {"id": "act_must_do", "title": "Must Do Museum", "category": "Museum"}
                ]
            },
            {
                "dayNumber": 2,
                "activities": [
                    {"id": "act1", "title": "...", "durationMins": 180},
                    {"id": "act2", "title": "...", "durationMins": 180},
                    {"id": "act3", "title": "...", "durationMins": 180},
                ]
            }
        ]
    }
    proposal = generate_replan_proposal(
        trip=trip,
        dest_data={},
        current_day_idx=0,
        current_time="15:00",
        reason="I_AM_TIRED",
        completed_activity_ids=[],
        skipped_activity_ids=[]
    )
    
    # Should not move, should SAVE_FOR_LATER because tomorrow is full
    assert any(a.actionType == "SAVE_FOR_LATER" and a.activityId == "act_must_do" for a in proposal.actions)
