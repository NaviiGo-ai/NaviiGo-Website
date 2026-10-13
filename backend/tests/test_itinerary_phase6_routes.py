"""Route-boundary tests for the Phase 6 itinerary contract.

These tests call the router functions with a verified UID and replace the
Firestore/service seams with local fakes.  They intentionally do not patch or
exercise persistence implementation details from ``user_data.py``.
"""

from copy import deepcopy
from uuid import uuid4

import pytest
from starlette.requests import Request

from app.core import dependencies
from app.core.errors import AppError, AuthRequiredError
from routers import itinerary


def _uuid() -> str:
    return str(uuid4())


def _request(headers=None) -> Request:
    raw_headers = [
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    ]
    return Request({"type": "http", "method": "POST", "path": "/api/itinerary", "headers": raw_headers})


class FakeSnapshot:
    def __init__(self, document_id, data):
        self.id = document_id
        self._data = deepcopy(data)
        self.exists = data is not None

    def to_dict(self):
        return deepcopy(self._data)


class FakeDocument:
    def __init__(self, db, path):
        self.db = db
        self.path = tuple(path)
        self.id = self.path[-1]

    def collection(self, name):
        return FakeCollection(self.db, self.path + (name,))

    def get(self):
        return FakeSnapshot(self.id, self.db.documents.get(self.path))

    def set(self, data, merge=False):
        current = deepcopy(self.db.documents.get(self.path, {})) if merge else {}
        current.update(deepcopy(data))
        self.db.documents[self.path] = current


class FakeQuery:
    def __init__(self, collection, field=None, value=None, max_results=None):
        self.collection = collection
        self.field = field
        self.value = value
        self.max_results = max_results

    def where(self, field, _operator, value):
        return FakeQuery(self.collection, field, value, self.max_results)

    def limit(self, max_results):
        return FakeQuery(self.collection, self.field, self.value, max_results)

    def stream(self):
        prefix = self.collection.path
        rows = []
        for path, data in self.collection.db.documents.items():
            if path[:-1] != prefix:
                continue
            if self.field is not None and data.get(self.field) != self.value:
                continue
            rows.append(FakeSnapshot(path[-1], data))
        return rows[: self.max_results] if self.max_results is not None else rows


class FakeCollection:
    def __init__(self, db, path):
        self.db = db
        self.path = tuple(path)

    def document(self, document_id=None):
        return FakeDocument(self.db, self.path + (document_id or f"auto-{len(self.db.documents)}",))

    def where(self, field, operator, value):
        return FakeQuery(self, field, value)


class FakeTransaction:
    def __init__(self, db):
        self.db = db
        self.operations = []

    def get(self, document):
        # Match the Admin SDK transaction contract: reads are iterators even
        # when the reference points to one document.
        return iter((document.get(),))

    def create(self, document, data):
        self.operations.append(("create", document, deepcopy(data)))

    def set(self, document, data):
        self.operations.append(("set", document, deepcopy(data)))

    def commit(self):
        for operation, document, data in self.operations:
            if operation == "create" and document.path in self.db.documents:
                raise RuntimeError("already exists")
            self.db.documents[document.path] = deepcopy(data)


class FakeFirestore:
    def __init__(self):
        self.documents = {}

    def collection(self, name):
        return FakeCollection(self, (name,))

    def transaction(self):
        return FakeTransaction(self)


@pytest.fixture(autouse=True)
def fake_transactional(monkeypatch):
    def transactional(callback):
        def run(transaction, *args, **kwargs):
            result = callback(transaction, *args, **kwargs)
            transaction.commit()
            return result

        return run

    monkeypatch.setattr(itinerary.firestore, "transactional", transactional)


def _owner_data(uid, itinerary_id, *, revision="rev_0"):
    return {
        "id": itinerary_id,
        "ownerUid": uid,
        "userId": uid,
        "revisionId": revision,
        "revisions": [{"revisionId": revision}],
        "form": {"days": 2, "budget": 0, "mustDo": []},
        "generatedData": {
            "id": itinerary_id,
            "itineraryId": itinerary_id,
            "destName": "Jaipur",
            "dayPlans": [
                {
                    "day": 1,
                    "dayNumber": 1,
                    "activities": [
                        {"activityId": "activity-a", "name": "Optional museum", "type": "attraction"},
                        {"activityId": "activity-b", "name": "Dinner reservation", "isBooked": True},
                    ],
                },
                {"day": 2, "dayNumber": 2, "activities": []},
            ],
        },
    }


@pytest.mark.asyncio
async def test_current_user_dependency_returns_typed_401_without_bearer():
    with pytest.raises(AuthRequiredError) as error:
        await dependencies._current_user_uid(None)

    assert error.value.code == "AUTH_REQUIRED"
    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_generate_uses_verified_uid_operation_id_and_one_persistence_call(monkeypatch):
    db = FakeFirestore()
    uid = "verified-user"
    operation_id = _uuid()
    persistence_calls = []

    async def fake_context(received_uid):
        assert received_uid == uid
        return {"interests": ["history"], "travelStyle": "luxury", "preferredGroup": "couple"}

    async def fake_destination(**_kwargs):
        return {"mapCenter": {"lat": 26.9, "lng": 75.8}, "dataSources": {"source": "fixture"}}

    async def fake_weather(**_kwargs):
        return {"source": "fixture", "current": None, "daily": []}

    def fake_generate(context, _destination):
        assert context["budget"] == 0
        assert context["preferences"] == {}
        return {
            "destName": context["destName"],
            "dayPlans": [{"day": 1, "activities": [{"name": "A museum"}]}],
            "highlights": [],
            "restaurants": [],
            "hotels": [],
        }

    async def fake_save(received_uid, data):
        persistence_calls.append((received_uid, deepcopy(data)))
        assert received_uid == uid
        document = db.collection("users").document(uid).collection("itineraries").document(operation_id)
        document.set({
            "ownerUid": uid,
            "userId": uid,
            "revisionId": "rev_0",
            "receipt": {
                "operationId": operation_id,
                "itineraryId": operation_id,
                "ownerUid": uid,
                "revisionId": "rev_0",
                "status": "committed",
            },
            "form": data["form"],
            "generatedData": data["generatedData"],
            "source": data["source"],
        })
        return {
            "status": "saved",
            "durable": True,
            "replayed": False,
            "receipt": db.documents[("users", uid, "itineraries", operation_id)]["receipt"],
        }

    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    monkeypatch.setattr(itinerary, "get_full_user_context", fake_context)
    monkeypatch.setattr(itinerary, "get_destination_data", fake_destination)
    monkeypatch.setattr(itinerary, "generate_itinerary", fake_generate)
    monkeypatch.setattr("services.weather_engine.get_weather", fake_weather)
    monkeypatch.setattr(itinerary, "save_itinerary", fake_save)

    payload = itinerary.ItineraryRequest(
        operationId=operation_id,
        userId="untrusted-body-user",
        destination="jaipur",
        destName="Jaipur",
        budget=0,
        preferences={},
        browsingSignals={},
        mustDo=[],
    )
    response = await itinerary.generate(payload, _request({"Idempotency-Key": operation_id}), uid)

    assert response["userId"] == uid
    assert response["itinerary"]["id"] == operation_id
    assert response["persistence"] == {"status": "saved", "durable": True, "replayed": False}
    assert response["receipt"] == {
        "operationId": operation_id,
        "itineraryId": operation_id,
        "ownerUid": uid,
        "revisionId": "rev_0",
        "status": "committed",
    }
    assert len(persistence_calls) == 1
    assert persistence_calls[0][1]["form"]["input"]["budget"] == 0
    assert persistence_calls[0][1]["form"]["input"]["preferences"] == {}
    assert persistence_calls[0][1]["form"]["input"]["userId"] == "untrusted-body-user"
    assert persistence_calls[0][1]["generatedData"]["dayPlans"][0]["activities"][0]["activityId"]


@pytest.mark.asyncio
async def test_generate_multi_city_uses_the_same_single_persistence_boundary(monkeypatch):
    db = FakeFirestore()
    uid = "verified-user"
    operation_id = _uuid()
    persistence_calls = []

    async def fake_context(received_uid):
        assert received_uid == uid
        return {}

    async def fake_multi_city(context, route_stops):
        assert context["budget"] == 0
        assert [stop.name for stop in route_stops] == ["Delhi"]
        return {
            "destName": "Jaipur → Delhi",
            "dayPlans": [{"day": 1, "activities": [{"name": "Route stop"}]}],
            "highlights": [],
            "restaurants": [],
            "hotels": [],
        }

    async def fake_save(received_uid, data):
        persistence_calls.append((received_uid, data))
        return {
            "status": "saved",
            "durable": True,
            "replayed": False,
            "receipt": {
                "operationId": operation_id,
                "itineraryId": operation_id,
                "ownerUid": received_uid,
                "revisionId": "rev_0",
                "status": "committed",
            },
        }

    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    monkeypatch.setattr(itinerary, "get_full_user_context", fake_context)
    monkeypatch.setattr(itinerary, "_generate_multi_city_itinerary", fake_multi_city)
    monkeypatch.setattr(itinerary, "save_itinerary", fake_save)

    payload = itinerary.ItineraryRequest(
        operationId=operation_id,
        destName="Jaipur",
        budget=0,
        routeStops=[itinerary.RouteStop(name="Delhi", stayDays=1)],
    )
    response = await itinerary.generate(payload, _request(), uid)

    assert response["source"] == "multi-city-personalized"
    assert len(persistence_calls) == 1
    assert persistence_calls[0][0] == uid
    assert persistence_calls[0][1]["generatedData"]["destName"] == "Jaipur → Delhi"


@pytest.mark.asyncio
async def test_generate_same_operation_different_request_returns_409(monkeypatch):
    db = FakeFirestore()
    uid = "owner-a"
    operation_id = _uuid()
    existing = _owner_data(uid, operation_id)
    existing["form"] = {"input": {"operationId": operation_id, "destName": "Jaipur", "budget": 0}}
    db.documents[("users", uid, "itineraries", operation_id)] = existing
    monkeypatch.setattr(itinerary, "get_db", lambda: db)

    payload = itinerary.ItineraryRequest(operationId=operation_id, destName="Goa", budget=0)
    with pytest.raises(AppError) as error:
        await itinerary.generate(payload, _request(), uid)

    assert error.value.status_code == 409
    assert error.value.code == "IDEMPOTENCY_CONFLICT"


@pytest.mark.asyncio
async def test_generate_requires_matching_uuid_v4_operation_identity(monkeypatch):
    db = FakeFirestore()
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    payload = itinerary.ItineraryRequest(operationId="not-a-uuid", destName="Jaipur")

    with pytest.raises(AppError) as error:
        await itinerary.generate(payload, _request(), "verified-user")

    assert error.value.status_code == 422
    assert error.value.code == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_accept_missing_proposal_returns_404(monkeypatch):
    db = FakeFirestore()
    uid = "verified-user"
    itinerary_id = _uuid()
    db.documents[("users", uid, "itineraries", itinerary_id)] = _owner_data(uid, itinerary_id)
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    payload = itinerary.ReplanAcceptRequest(
        itineraryId=itinerary_id,
        proposalId="missing-proposal",
        baseRevisionId="rev_0",
        operationId=_uuid(),
    )

    with pytest.raises(AppError) as error:
        await itinerary.accept_replan(payload, _request(), uid)

    assert error.value.status_code == 404
    assert error.value.code == "PROPOSAL_NOT_FOUND"


@pytest.mark.asyncio
async def test_replan_missing_owner_itinerary_returns_404(monkeypatch):
    db = FakeFirestore()
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    payload = itinerary.ReplanRequest(
        itineraryId="missing-itinerary",
        operationId=_uuid(),
        baseRevisionId="rev_0",
        currentDayNumber=1,
        currentTime="15:00",
        reason="I_AM_TIRED",
    )

    with pytest.raises(AppError) as error:
        await itinerary.replan_itinerary(payload, _request(), "verified-user")

    assert error.value.status_code == 404
    assert error.value.code == "ITINERARY_NOT_FOUND"


@pytest.mark.asyncio
async def test_replan_unsupported_reason_returns_422(monkeypatch):
    db = FakeFirestore()
    uid = "verified-user"
    itinerary_id = _uuid()
    db.documents[("users", uid, "itineraries", itinerary_id)] = _owner_data(uid, itinerary_id)
    monkeypatch.setattr(itinerary, "get_db", lambda: db)

    payload = itinerary.ReplanRequest(
        itineraryId=itinerary_id,
        operationId=_uuid(),
        baseRevisionId="rev_0",
        currentDayNumber=1,
        currentTime="15:00",
        reason="RAIN",
    )
    with pytest.raises(AppError) as error:
        await itinerary.replan_itinerary(payload, _request(), uid)

    assert error.value.status_code == 422
    assert error.value.code == "REPLAN_VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_replan_and_accept_return_server_owned_receipts(monkeypatch):
    db = FakeFirestore()
    uid = "verified-user"
    itinerary_id = _uuid()
    replan_operation_id = _uuid()
    accept_operation_id = _uuid()
    db.documents[("users", uid, "itineraries", itinerary_id)] = _owner_data(uid, itinerary_id)
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    monkeypatch.setattr(itinerary, "get_destination_data", lambda **_kwargs: _empty_async_result({"source": "fixture"}))

    replan_payload = itinerary.ReplanRequest(
        itineraryId=itinerary_id,
        operationId=replan_operation_id,
        baseRevisionId="rev_0",
        currentDayNumber=1,
        currentTime="15:00",
        reason="I_AM_TIRED",
        completedActivityIds=["activity-b"],
    )
    proposal_response = await itinerary.replan_itinerary(replan_payload, _request(), uid)
    proposal = proposal_response["proposal"]

    assert proposal["ownerUid"] == uid
    assert proposal["itineraryId"] == itinerary_id
    assert proposal["operationId"] == replan_operation_id
    assert proposal["proposalId"] == replan_operation_id
    assert proposal_response["replayed"] is False

    accept_payload = itinerary.ReplanAcceptRequest(
        itineraryId=itinerary_id,
        proposalId=proposal["proposalId"],
        baseRevisionId="rev_0",
        operationId=accept_operation_id,
        proposalData={"actions": [{"actionType": "REMOVE", "activityId": "activity-b"}]},
    )
    accepted = await itinerary.accept_replan(accept_payload, _request(), uid)
    receipt = accepted["receipt"]
    assert accepted["status"] == "accepted"
    assert receipt == {
        "status": "accepted",
        "ownerUid": uid,
        "itineraryId": itinerary_id,
        "proposalId": proposal["proposalId"],
        "operationId": accept_operation_id,
        "previousRevisionId": "rev_0",
        "revisionId": "rev_1",
        "idempotent": False,
    }
    assert accepted["itinerary"]["revisionId"] == "rev_1"
    assert accepted["itinerary"]["dayPlans"][0]["activities"] == [{
        "activityId": "activity-b",
        "name": "Dinner reservation",
        "isBooked": True,
        "id": "activity-b",
    }]
    owner = db.documents[("users", uid, "itineraries", itinerary_id)]
    assert owner["lastReceipt"] == receipt
    assert owner["acceptanceReceipts"][accept_operation_id] == receipt

    replay = await itinerary.accept_replan(accept_payload, _request(), uid)
    assert replay["receipt"] == receipt
    assert replay["itinerary"]["revisionId"] == "rev_1"

    # A retry after a later revision returns the historical receipt and the
    # current authoritative owner document without applying the proposal again.
    owner["revisionId"] = "rev_2"
    owner["generatedData"]["revisionId"] = "rev_2"
    later_replay = await itinerary.accept_replan(accept_payload, _request(), uid)
    assert later_replay["receipt"] == receipt
    assert later_replay["itinerary"]["revisionId"] == "rev_2"


def test_generation_boundary_replaces_duplicate_activity_id_occurrences():
    normalized = itinerary._ensure_activity_identity({
        "dayPlans": [{
            "day": 1,
            "activities": [
                {"activityId": "same", "name": "First"},
                {"activityId": "same", "name": "Second"},
                {"name": "Third"},
            ],
        }],
    })

    activities = normalized["dayPlans"][0]["activities"]
    ids = [activity["activityId"] for activity in activities]
    assert ids[0] == "same"
    assert len(ids) == len(set(ids))
    assert all(activity["id"] == activity["activityId"] for activity in activities)


def test_matching_empty_draft_is_not_reported_as_a_durable_replay():
    caller_form = {"destination": "jaipur", "destName": "Jaipur", "days": 3, "budget": 0}
    draft = {"form": {"input": caller_form}, "generatedData": None}

    assert itinerary._replay_or_conflict(draft, caller_form, "owner", _uuid()) is None


async def _empty_async_result(value):
    return value


@pytest.mark.asyncio
@pytest.mark.parametrize("status", ["completed", "cancelled", "canceled"])
async def test_terminal_journeys_reject_new_replan_and_acceptance(monkeypatch, status):
    db = FakeFirestore()
    uid, itinerary_id, proposal_id = "owner", _uuid(), _uuid()
    owner = _owner_data(uid, itinerary_id)
    owner["status"] = status
    db.documents[("users", uid, "itineraries", itinerary_id)] = owner
    db.documents[("users", uid, "itineraries", itinerary_id, "proposals", proposal_id)] = {
        "ownerUid": uid, "itineraryId": itinerary_id, "baseRevisionId": "rev_0", "actions": []
    }
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    before = deepcopy(db.documents)
    request = itinerary.ReplanRequest(itineraryId=itinerary_id, operationId=_uuid(), baseRevisionId="rev_0", currentDayNumber=1, currentTime="14:00", reason="I_AM_TIRED")
    acceptance = itinerary.ReplanAcceptRequest(itineraryId=itinerary_id, proposalId=proposal_id, baseRevisionId="rev_0", operationId=_uuid())
    for handler, payload in [(itinerary.replan_itinerary, request), (itinerary.accept_replan, acceptance)]:
        with pytest.raises(AppError) as error:
            await handler(payload, _request(), uid)
        assert error.value.code == "TRIP_TERMINAL"
        assert error.value.status_code == 409
    assert db.documents == before


@pytest.mark.asyncio
@pytest.mark.parametrize("full_later_day", [False, True])
async def test_priority_stop_without_safe_later_day_can_be_reviewed_and_accepted(monkeypatch, full_later_day):
    db = FakeFirestore()
    uid, itinerary_id = "owner", _uuid()
    owner = _owner_data(uid, itinerary_id)
    priority = {"activityId": "priority", "name": "Priority Museum", "durationMins": 60, "isMustDo": True, "details": {"note": "preserve"}}
    owner["form"]["mustDo"] = [{"activityId": "priority", "name": "Priority Museum"}]
    owner["generatedData"]["dayPlans"] = [{"dayNumber": 9, "activities": [priority, {"activityId": "optional", "name": "Optional Park"}]}]
    if full_later_day:
        owner["generatedData"]["dayPlans"].append({"dayNumber": 12, "activities": [{"activityId": "later", "id": "later", "name": "Full Day", "durationMins": 480}]})
    db.documents[("users", uid, "itineraries", itinerary_id)] = owner
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    monkeypatch.setattr(itinerary, "get_destination_data", lambda **kwargs: _empty_async_result({"source": "fixture"}))

    requested = await itinerary.replan_itinerary(itinerary.ReplanRequest(
        itineraryId=itinerary_id, operationId=_uuid(), baseRevisionId="rev_0", currentDayNumber=9,
        currentTime="15:00", destinationTimezone="Asia/Kolkata", reason="I_AM_TIRED",
    ), _request(), uid)
    proposal = requested["proposal"]
    assert next(action for action in proposal["actions"] if action["activityId"] == "priority")["actionType"] == "KEEP"
    assert proposal["warnings"]
    assert not any(action["actionType"] in {"SAVE_FOR_LATER", "END_DAY_EARLY"} for action in proposal["actions"])

    accepted = await itinerary.accept_replan(itinerary.ReplanAcceptRequest(
        itineraryId=itinerary_id, proposalId=proposal["proposalId"], baseRevisionId="rev_0", operationId=_uuid(),
    ), _request(), uid)
    saved_priority = accepted["itinerary"]["dayPlans"][0]["activities"]
    assert saved_priority == [{**priority, "id": "priority"}]
    assert accepted["receipt"]["revisionId"] == "rev_1"
    if full_later_day:
        assert accepted["itinerary"]["dayPlans"][1] == owner["generatedData"]["dayPlans"][1]


@pytest.mark.asyncio
async def test_acceptance_operation_replay_rejects_changed_base_revision(monkeypatch):
    db = FakeFirestore()
    uid, itinerary_id, proposal_id, operation_id = "owner", _uuid(), _uuid(), _uuid()
    owner = _owner_data(uid, itinerary_id, revision="rev_2")
    owner["acceptanceReceipts"] = {operation_id: {
        "status": "accepted", "ownerUid": uid, "itineraryId": itinerary_id,
        "proposalId": proposal_id, "operationId": operation_id,
        "previousRevisionId": "rev_0", "revisionId": "rev_1", "idempotent": False,
    }}
    db.documents[("users", uid, "itineraries", itinerary_id)] = owner
    monkeypatch.setattr(itinerary, "get_db", lambda: db)
    before = deepcopy(db.documents)
    with pytest.raises(AppError) as error:
        await itinerary.accept_replan(itinerary.ReplanAcceptRequest(
            itineraryId=itinerary_id, proposalId=proposal_id, operationId=operation_id, baseRevisionId="rev_other",
        ), _request(), uid)
    assert error.value.code == "IDEMPOTENCY_CONFLICT"
    assert error.value.status_code == 409
    assert db.documents == before


@pytest.mark.parametrize("receipt_base", ["rev_0", "rev_other"])
def test_competing_acceptance_replay_checks_the_original_base(monkeypatch, receipt_base):
    db = FakeFirestore()
    uid, itinerary_id, proposal_id, operation_id = "owner", _uuid(), _uuid(), _uuid()
    expected_owner = _owner_data(uid, itinerary_id)
    expected_proposal = {"proposalId": proposal_id, "itineraryId": itinerary_id, "baseRevisionId": "rev_0"}
    latest_owner = _owner_data(uid, itinerary_id, revision="rev_1")
    latest_owner["acceptanceReceipts"] = {operation_id: {
        "itineraryId": itinerary_id, "proposalId": proposal_id, "previousRevisionId": receipt_base,
    }}
    owner_ref = db.collection("users").document(uid).collection("itineraries").document(itinerary_id)
    proposal_ref = owner_ref.collection("proposals").document(proposal_id)
    db.documents[owner_ref.path] = latest_owner
    db.documents[proposal_ref.path] = expected_proposal
    before = deepcopy(db.documents)
    args = (db, owner_ref, proposal_ref, expected_owner, expected_proposal, expected_owner, operation_id, itinerary_id, proposal_id)
    if receipt_base == "rev_0":
        assert itinerary._transactional_owner_write(*args) == ("existing", latest_owner)
    else:
        with pytest.raises(AppError) as error:
            itinerary._transactional_owner_write(*args)
        assert error.value.code == "IDEMPOTENCY_CONFLICT"
    assert db.documents == before
