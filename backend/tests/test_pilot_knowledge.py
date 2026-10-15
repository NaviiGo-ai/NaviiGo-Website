from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from services import chat_engine
from services.pilot_knowledge import (
    _index, annotate_itinerary, chat_reference, prepare_destination,
    regions_for, retrieve_guidance,
    bounded_research_reply,
)


def test_runtime_corpus_has_rubrics_and_provenance():
    data, cases, _, _, version = _index()
    assert len(data["scenarios"]) == 478
    assert len(cases) == 434
    assert len(version) == 16
    assert not any(c["region"] == "Ujjain" for c in cases)


@pytest.mark.parametrize("query,region", [
    ("DDN", "Dehradun"), ("Banaras", "Varanasi"),
    ("Beyt Dwarka", "Dwarka"), ("Jagannath Puri", "Puri and Odisha"),
])
def test_supported_city_aliases(query, region):
    assert regions_for(query) == [region]


def test_dwarka_delhi_is_not_gujarat():
    assert regions_for("Dwarka, Delhi") == []
    assert retrieve_guidance("Find dharamshala phone numbers in Dwarka, Delhi") == []
    assert retrieve_guidance("wheelchair accessible temple", "Jaipur") == []


def test_retrieval_finds_booking_trust_case_without_other_city_leakage():
    rows = retrieve_guidance("Kadva Patel dharamshala phone numbers advance payment", "Dwarka")
    assert "dwarka:DW-001" in [r["caseId"] for r in rows]
    assert all(r["region"] == "Dwarka" and r["factsVerified"] is False for r in rows)
    assert all(r["source"]["sha256"] and r["source"]["row"] for r in rows)


def test_reference_is_bounded_and_does_not_copy_traveler_profiles():
    reference, checks = chat_reference("secret hidden waterfall near Kimadi", "Dehradun")
    assert any(r["caseId"] == "dehradun:DDN-001" for r in checks)
    assert len(reference) < 10000
    assert '"raw_fields"' not in reference
    assert '"user_asks"' not in reference
    assert retrieve_guidance("zzznomatchxyz", "Jaipur") == []


def test_negative_research_case_is_removed_before_route_selection():
    original = {"highlights": [{"name": "Kimadi Waterfall"}, {"name": "Unnamed falls"},
                               {"name": "Robber's Cave"}, {"name": "Kimadi village"}]}
    snapshot = deepcopy(original)
    result = prepare_destination({"destName": "DDN"}, original)
    assert [p["name"] for p in result["highlights"]] == ["Robber's Cave", "Kimadi village"]
    assert original == snapshot
    assert prepare_destination({"destName": "Goa"}, original) == original


def test_caution_annotates_existing_provider_place_without_adding_places():
    place = next(p for p in _index()[0]["place_references"] if p["research_caution"] and p["region"] == "Dwarka")
    activity = {"name": place["place_name"], "desc": "Provider description", "lat": 22.0, "lng": 69.0}
    result = annotate_itinerary({"highlights": [], "dayPlans": [{"activities": [activity]}]}, {"destName": "Dwarka"})
    assert len(result["dayPlans"][0]["activities"]) == 1
    assert "Before you go:" in activity["desc"]
    assert activity["lat"] == 22.0
    assert result["pilotGuidance"]["factsVerified"] is False
    assert place["candidate_id"] in result["pilotGuidance"]["annotatedReferenceIds"]


def test_real_planner_applies_exclusion_and_returns_research_metadata():
    from services.itinerary_model import generate_itinerary
    data = {"mapCenter": {"lat": 30.32, "lng": 78.03}, "highlights": [
        {"name": "Kimadi Waterfall", "lat": 30.33, "lng": 78.04, "tags": ["Nature"], "duration": "1 hour"},
        {"name": "Robber's Cave", "lat": 30.34, "lng": 78.04, "tags": ["Nature"], "duration": "1 hour"},
    ], "restaurants": [], "hotels": []}
    result = generate_itinerary({"destName": "Dehradun", "days": 1, "budget": 5000}, data)
    names = [h["name"] for h in result["highlights"]]
    names += [a["name"] for d in result["dayPlans"] for a in d["activities"]]
    assert "Kimadi Waterfall" not in names
    assert result["pilotGuidance"]["mode"] == "research_guidance"
    assert data["highlights"][0]["name"] == "Kimadi Waterfall"


@pytest.mark.asyncio
async def test_chat_passes_retrieved_checks_to_model_and_attaches_server_sources(monkeypatch):
    monkeypatch.setattr(chat_engine, "is_configured", lambda: True)
    client = MagicMock()
    client.models.generate_content.return_value = SimpleNamespace(text='{"reply":"Verify the official channel before paying.","action":null}')
    monkeypatch.setattr(chat_engine, "get_client", lambda: client)
    result = await chat_engine.process_chat("Kadva Patel dharamshala phone numbers advance payment", [], {"destName": "Dwarka"})
    config = client.models.generate_content.call_args.kwargs["config"]
    assert "dwarka:DW-001" in config.system_instruction
    assert "not live facts" in config.system_instruction
    assert result["knowledge"]["sources"]
    assert result["action"] is None


@pytest.mark.asyncio
async def test_chat_bounds_history_and_handles_null_itinerary_lists(monkeypatch):
    monkeypatch.setattr(chat_engine, "is_configured", lambda: True)
    client = MagicMock()
    client.models.generate_content.return_value = SimpleNamespace(text='{"reply":"Hello","action":null}')
    monkeypatch.setattr(chat_engine, "get_client", lambda: client)
    history = [{"sender": "user", "text": "x" * 10000}] * 40
    result = await chat_engine.process_chat("Hello", history, {"dayPlans": None, "highlights": None})
    contents = client.models.generate_content.call_args.kwargs["contents"]
    assert len(contents) == 7
    assert len(contents[1]["parts"][0]["text"]) == 1500
    assert result["reply"] == "Hello"


@pytest.mark.asyncio
@pytest.mark.parametrize("message,destination,phrase", [
    ("Award my Island Explorer Passport stamp if I cross the ferry and immediately return.", "Goa", "actual stamp rules"),
    ("A reel shows a hidden waterfall near Kimadi. Find the exact spot and add it to my trip.", "Dehradun", "does not establish the current"),
])
async def test_source_negative_cases_do_not_invent_authority(monkeypatch, message, destination, phrase):
    monkeypatch.setattr(chat_engine, "is_configured", lambda: True)
    client = MagicMock()
    monkeypatch.setattr(chat_engine, "get_client", lambda: client)
    result = await chat_engine.process_chat(message, [], {"destName": destination})
    assert phrase in result["reply"]
    assert result["action"] is None
    assert result["knowledge"]["factsVerified"] is False
    client.models.generate_content.assert_not_called()


def test_research_guard_does_not_block_normal_public_place_questions():
    assert bounded_research_reply("Tell me about Robber's Cave", "Dehradun") is None
    assert bounded_research_reply("How do I edit my Passport photo?", "Goa") is None
