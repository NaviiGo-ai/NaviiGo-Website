"""Phase 6 persistence tests at the Firestore service boundary.

The fake below intentionally exposes synchronous Firestore-shaped methods.  The
service must therefore execute them through ``asyncio.to_thread`` just as it
does with the Admin SDK client in production.
"""

from copy import deepcopy
from typing import Any, Dict, Optional, Tuple

import pytest

from services import user_data


class _FakeSnapshot:
    def __init__(self, document_id: str, data: Optional[Dict[str, Any]]):
        self.id = document_id
        self._data = deepcopy(data)
        self.exists = data is not None

    def to_dict(self) -> Optional[Dict[str, Any]]:
        return deepcopy(self._data)


class _FakeIncrement:
    def __init__(self, amount: int):
        self.amount = amount


class _FakeArrayUnion:
    def __init__(self, values):
        self.values = list(values)


class _FakeDocument:
    def __init__(self, db: "_FakeFirestore", path: Tuple[str, ...]):
        self.db = db
        self.path = path
        self.id = path[-1]

    def collection(self, name: str) -> "_FakeCollection":
        return _FakeCollection(self.db, self.path + (name,))

    def get(self) -> _FakeSnapshot:
        return _FakeSnapshot(self.id, self.db.documents.get(self.path))

    def set(self, data: Dict[str, Any], merge: bool = False) -> None:
        self.db.set_document(self, data, merge=merge)

    def update(self, data: Dict[str, Any]) -> None:
        if self.path not in self.db.documents:
            raise RuntimeError("document does not exist")
        self.db.update_document(self, data)


class _FakeQuery:
    def __init__(self, collection: "_FakeCollection", max_results: Optional[int] = None):
        self.collection = collection
        self.max_results = max_results

    def limit(self, max_results: int) -> "_FakeQuery":
        return _FakeQuery(self.collection, max_results)

    def stream(self):
        prefix = self.collection.path
        rows = [
            (path, data)
            for path, data in self.collection.db.documents.items()
            if path[:-1] == prefix
        ]
        if self.max_results is not None:
            rows = rows[: self.max_results]
        return [_FakeSnapshot(path[-1], data) for path, data in rows]


class _FakeCollection:
    def __init__(self, db: "_FakeFirestore", path: Tuple[str, ...]):
        self.db = db
        self.path = path

    def document(self, document_id: Optional[str] = None) -> _FakeDocument:
        if document_id is None:
            document_id = f"generated-{len(self.db.documents)}"
        return _FakeDocument(self.db, self.path + (document_id,))

    def order_by(self, _field: str, direction: str = "ASCENDING") -> _FakeQuery:
        return _FakeQuery(self)

    def stream(self):
        return _FakeQuery(self).stream()


class _FakeTransaction:
    def __init__(self, db: "_FakeFirestore"):
        self.db = db
        self.operations = []

    def get(self, document: _FakeDocument) -> _FakeSnapshot:
        # google-cloud-firestore Transaction.get(DocumentReference) returns a
        # one-snapshot stream, not a DocumentSnapshot directly.
        return iter((document.get(),))

    def create(self, document: _FakeDocument, data: Dict[str, Any]) -> None:
        self.operations.append(("create", document, data))

    def update(self, document: _FakeDocument, data: Dict[str, Any]) -> None:
        self.operations.append(("update", document, data))

    def set(self, document: _FakeDocument, data: Dict[str, Any]) -> None:
        self.operations.append(("set", document, data))

    def commit(self) -> None:
        if self.db.fail_commit:
            raise RuntimeError("Firestore unavailable")
        for operation, document, data in self.operations:
            if operation == "create":
                if document.path in self.db.documents:
                    raise RuntimeError("already exists")
                self.db.set_document(document, data)
            elif operation == "set":
                self.db.set_document(document, data)
            else:
                self.db.update_document(document, data)


class _FakeFirestore:
    def __init__(self, fail_commit: bool = False):
        self.documents: Dict[Tuple[str, ...], Dict[str, Any]] = {}
        self.fail_commit = fail_commit

    def collection(self, name: str) -> _FakeCollection:
        return _FakeCollection(self, (name,))

    def transaction(self) -> _FakeTransaction:
        return _FakeTransaction(self)

    def set_document(self, document: _FakeDocument, data: Dict[str, Any], merge: bool = False) -> None:
        current = deepcopy(self.documents.get(document.path, {})) if merge else {}
        self.documents[document.path] = self._apply_values({**current, **deepcopy(data)}, current)

    def update_document(self, document: _FakeDocument, data: Dict[str, Any]) -> None:
        if document.path not in self.documents:
            raise RuntimeError("document does not exist")
        current = deepcopy(self.documents[document.path])
        self.documents[document.path] = self._apply_values(data, current)

    @staticmethod
    def _apply_values(data: Dict[str, Any], current: Dict[str, Any]) -> Dict[str, Any]:
        result = deepcopy(current)
        for key, value in data.items():
            if isinstance(value, _FakeIncrement):
                result[key] = result.get(key, 0) + value.amount
            elif isinstance(value, _FakeArrayUnion):
                values = list(result.get(key, []))
                for item in value.values:
                    if item not in values:
                        values.append(item)
                result[key] = values
            else:
                result[key] = deepcopy(value)
        return result


@pytest.fixture
def fake_firestore(monkeypatch):
    db = _FakeFirestore()
    monkeypatch.setattr(user_data, "get_db", lambda: db)
    monkeypatch.setattr(user_data.firestore, "SERVER_TIMESTAMP", "server-timestamp")
    monkeypatch.setattr(user_data.firestore, "Increment", _FakeIncrement)
    monkeypatch.setattr(user_data.firestore, "ArrayUnion", _FakeArrayUnion)

    def transactional(callback):
        def run(transaction, *args, **kwargs):
            result = callback(transaction, *args, **kwargs)
            transaction.commit()
            return result

        return run

    monkeypatch.setattr(user_data.firestore, "transactional", transactional)
    return db


def _request(operation_id: str, destination: str = "jaipur", **overrides: Any) -> Dict[str, Any]:
    request = {
        "operationId": operation_id,
        "destination": destination,
        "destName": destination.title(),
        "form": {"days": 3, "budget": 0},
        "generatedData": {"dayPlans": [{"day": 1, "activities": []}]},
    }
    request.update(overrides)
    return request


@pytest.mark.asyncio
async def test_save_replay_is_owner_scoped_and_initializes_revision(fake_firestore):
    uid = "traveller-a"
    fake_firestore.documents[("users", uid)] = {"totalTrips": 2}

    first = await user_data.save_itinerary(uid, _request("operation-1"))
    replay = await user_data.save_itinerary(uid, _request("operation-1"))

    assert first["status"] == "saved"
    assert first["durable"] is True
    assert first["replayed"] is False
    assert first["receipt"]["revisionId"] == "rev_0"
    assert replay["status"] == "saved"
    assert replay["durable"] is True
    assert replay["replayed"] is True
    assert replay["receipt"] == first["receipt"]

    itinerary = fake_firestore.documents[("users", uid, "itineraries", "operation-1")]
    assert itinerary["revisionId"] == "rev_0"
    assert itinerary["status"] == "planned"
    assert itinerary["revisions"] == [{"revisionId": "rev_0", "status": "planned"}]
    assert fake_firestore.documents[("users", uid)]["totalTrips"] == 3
    assert fake_firestore.documents[("users", uid, "ai_profile", "main")]["pastDestinations"] == ["jaipur"]


@pytest.mark.asyncio
async def test_same_operation_id_isolated_between_owners(fake_firestore):
    operation_id = "shared-operation"
    fake_firestore.documents[("users", "owner-a")] = {"totalTrips": 0}
    fake_firestore.documents[("users", "owner-b")] = {"totalTrips": 4}

    first = await user_data.save_itinerary("owner-a", _request(operation_id, "delhi"))
    second = await user_data.save_itinerary("owner-b", _request(operation_id, "mumbai"))

    assert first["status"] == "saved"
    assert second["status"] == "saved"
    assert second["replayed"] is False
    assert fake_firestore.documents[("users", "owner-a", "itineraries", operation_id)]["destId"] == "delhi"
    assert fake_firestore.documents[("users", "owner-b", "itineraries", operation_id)]["destId"] == "mumbai"


@pytest.mark.asyncio
async def test_fingerprint_conflict_does_not_overwrite_or_repeat_side_effects(fake_firestore):
    uid = "traveller-conflict"
    fake_firestore.documents[("users", uid)] = {"totalTrips": 0}

    first = await user_data.save_itinerary(uid, _request("operation-conflict", "goa"))
    replay = await user_data.save_itinerary(uid, _request("operation-conflict", "goa", generatedData={"dayPlans": []}))

    assert first["status"] == "saved"
    assert replay["status"] == "saved"
    assert replay["durable"] is True
    assert replay["replayed"] is True
    assert fake_firestore.documents[("users", uid)]["totalTrips"] == 1
    assert fake_firestore.documents[("users", uid, "itineraries", "operation-conflict")]["generatedData"] == {
        "dayPlans": [{"day": 1, "activities": []}]
    }


@pytest.mark.asyncio
async def test_matching_empty_setup_draft_is_promoted_atomically(fake_firestore):
    uid = "traveller-draft"
    operation_id = "operation-draft"
    caller_form = {"destination": "jaipur", "destName": "Jaipur", "days": 3, "budget": 0}
    fake_firestore.documents[("users", uid)] = {"totalTrips": 0}
    fake_firestore.documents[("users", uid, "itineraries", operation_id)] = {
        "form": {"input": caller_form},
        "generatedData": None,
        "destName": "Jaipur",
    }

    result = await user_data.save_itinerary(
        uid,
        _request(
            operation_id,
            "jaipur",
            form={"input": caller_form},
            generatedData={"dayPlans": [{"day": 1, "activities": [{"activityId": "a"}]}]},
        ),
    )

    assert result["status"] == "saved"
    assert result["replayed"] is False
    promoted = fake_firestore.documents[("users", uid, "itineraries", operation_id)]
    assert promoted["generatedData"]["dayPlans"][0]["activities"][0]["activityId"] == "a"
    assert promoted["receipt"]["status"] == "committed"
    assert fake_firestore.documents[("users", uid)]["totalTrips"] == 1


@pytest.mark.asyncio
async def test_missing_profile_can_save_and_write_failure_is_unsaved(monkeypatch):
    missing_profile_db = _FakeFirestore()
    monkeypatch.setattr(user_data, "get_db", lambda: missing_profile_db)
    monkeypatch.setattr(user_data.firestore, "SERVER_TIMESTAMP", "server-timestamp")
    monkeypatch.setattr(user_data.firestore, "Increment", _FakeIncrement)
    monkeypatch.setattr(user_data.firestore, "ArrayUnion", _FakeArrayUnion)
    monkeypatch.setattr(
        user_data.firestore,
        "transactional",
        lambda callback: lambda transaction, *args, **kwargs: (
            callback(transaction, *args, **kwargs),
            transaction.commit(),
        )[0],
    )

    saved = await user_data.save_itinerary("new-user", _request("operation-missing-profile"))
    assert saved["status"] == "saved"
    assert saved["durable"] is True
    assert ("users", "new-user", "itineraries", "operation-missing-profile") in missing_profile_db.documents
    assert ("users", "new-user") not in missing_profile_db.documents

    failed_db = _FakeFirestore(fail_commit=True)
    monkeypatch.setattr(user_data, "get_db", lambda: failed_db)
    failed = await user_data.save_itinerary("failed-user", _request("operation-failed"))
    assert failed["status"] == "unsaved"
    assert failed["durable"] is False
    assert failed["error"] == "PERSISTENCE_WRITE_FAILED"
    assert ("users", "failed-user", "itineraries", "operation-failed") not in failed_db.documents
    assert ("users", "failed-user", "ai_profile", "main") not in failed_db.documents


@pytest.mark.asyncio
async def test_missing_operation_id_is_explicitly_unsaved(fake_firestore):
    result = await user_data.save_itinerary(
        "traveller-without-operation",
        {"destination": "udaipur", "generatedData": {"dayPlans": []}},
    )

    assert result["status"] == "unsaved"
    assert result["persistence"]["status"] == "unsaved"
    assert result["durable"] is False
    assert result["error"] == "OPERATION_ID_REQUIRED"
