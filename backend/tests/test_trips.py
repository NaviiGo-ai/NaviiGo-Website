import pytest
from uuid import uuid4
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.models.enums import SourceType, TripStatus
from app.trips.service import TripService
from app.trips.schemas import (
    TripCreate,
    TripUpdate,
    TripDayIn,
    TripItemIn,
    TripItemUpdate,
    TripPreferenceIn,
    TripStatusUpdate,
)
from app.core.errors import TripNotFoundError, InvalidStateTransition

pytestmark = pytest.mark.asyncio


async def _user(db: AsyncSession, email: str) -> User:
    user = User(firebase_uid=f"fb_{email}", email=email, display_name="Test User")
    db.add(user)
    await db.flush()
    return user


def _trip_create(**overrides) -> TripCreate:
    payload = dict(
        title="Test Trip",
        destination_name="Paris",
        destination_city="Paris",
        destination_country="France",
        origin_city="London",
        start_date=date(2025, 10, 1),
        end_date=date(2025, 10, 7),
        duration_days=6,
        group_type="solo",
        travel_purpose="leisure",
        budget_total=Decimal("1000.00"),
        currency="EUR",
    )
    payload.update(overrides)
    return TripCreate(**payload)


async def test_trip_create(get_test_db: AsyncSession):
    """Test creating a trip with and without preferences."""
    user = await _user(get_test_db, "test@example.com")
    service = TripService(get_test_db)

    # Without preferences → DRAFT
    trip = await service.create(user, _trip_create())
    assert trip.id is not None
    assert trip.status == TripStatus.DRAFT
    assert trip.title == "Test Trip"

    # With preferences → PLANNING
    pref = TripPreferenceIn(
        interests=["culture", "food"],
        dietary_preferences=["vegetarian"],
        accessibility_needs=[],
        pace="balanced",
        hotel_area="city center",
        must_do=["Eiffel Tower"],
    )
    trip2 = await service.create(user, _trip_create(preferences=pref))
    assert trip2.status == TripStatus.PLANNING
    assert trip2.preferences is not None
    assert trip2.preferences.interests == ["culture", "food"]


async def test_trip_get(get_test_db: AsyncSession):
    """Test retrieving a trip by ID."""
    user = await _user(get_test_db, "test2@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create(title="Another Trip"))

    fetched = await service.get(trip.id)
    assert fetched.id == trip.id
    assert fetched.title == "Another Trip"

    with pytest.raises(TripNotFoundError):
        await service.get(uuid4())


async def test_trip_update(get_test_db: AsyncSession):
    """Test updating a trip's details and preferences."""
    user = await _user(get_test_db, "test3@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create(title="Updatable Trip"))

    updated = await service.update(
        trip, user.id, TripUpdate(title="Updated Trip Title", budget_total=Decimal("1800.00"))
    )
    assert updated.title == "Updated Trip Title"
    assert updated.budget_total == Decimal("1800.00")

    pref = TripPreferenceIn(
        interests=["history", "art"], pace="relaxed", hotel_area="historic center"
    )
    updated2 = await service.update(trip, user.id, TripUpdate(preferences=pref))
    assert updated2.preferences is not None
    assert updated2.preferences.interests == ["history", "art"]
    assert updated2.preferences.pace == "relaxed"


async def test_trip_transition(get_test_db: AsyncSession):
    """Test trip status transitions and invalid ones."""
    user = await _user(get_test_db, "test4@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create())
    assert trip.status == TripStatus.DRAFT

    # DRAFT → PLANNING → READY
    t1 = await service.transition(trip, user.id, TripStatusUpdate(status=TripStatus.PLANNING))
    assert t1.status == TripStatus.PLANNING

    t2 = await service.transition(trip, user.id, TripStatusUpdate(status=TripStatus.READY))
    assert t2.status == TripStatus.READY

    # READY → DRAFT is not allowed
    with pytest.raises(InvalidStateTransition):
        await service.transition(trip, user.id, TripStatusUpdate(status=TripStatus.DRAFT))


async def test_trip_add_day_and_item(get_test_db: AsyncSession):
    """Test adding a day and an item to a trip."""
    user = await _user(get_test_db, "test5@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create())

    trip_with_day = await service.add_day(
        trip, user.id, TripDayIn(date=date(2025, 10, 2), title="Day 2: Sagrada", is_transit_day=False)
    )
    assert len(trip_with_day.days) == 1
    day_id = trip_with_day.days[0].id

    item_in = TripItemIn(
        name="Visit Sagrada Familia",
        item_type="attraction",
        description="Book tickets in advance",
        lat=41.4036,
        lng=2.1744,
        coords_source=SourceType.VERIFIED_LIVE,
        slot="morning",
        start_time="09:00",
        end_time="12:00",
        duration_minutes=180,
        category="sightseeing",
        is_must_do=True,
        pricing={"price": "26.00"},
        source_type=SourceType.USER_PROVIDED,
    )
    trip_with_item = await service.add_item(trip_with_day, user.id, day_id, item_in)
    assert len(trip_with_item.days[0].items) == 1
    item = trip_with_item.days[0].items[0]
    assert item.name == "Visit Sagrada Familia"
    assert item.lat == 41.4036
    assert item.item_type == "attraction"

    # Update the item
    updated_trip = await service.update_item(
        trip_with_item,
        user.id,
        item.id,
        TripItemUpdate(name="Sagrada with Audio Guide", pricing={"price": "30.00"}),
    )
    updated_item = updated_trip.days[0].items[0]
    assert updated_item.name == "Sagrada with Audio Guide"
    assert updated_item.pricing == {"price": "30.00"}

    # Remove the item
    after_remove = await service.remove_item(updated_trip, user.id, item.id)
    assert len(after_remove.days[0].items) == 0


async def test_trip_undo(get_test_db: AsyncSession):
    """Test undoing a trip change."""
    user = await _user(get_test_db, "test6@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create(title="Undo Trip"))

    updated = await service.update(trip, user.id, TripUpdate(title="Changed Title"))
    assert updated.title == "Changed Title"

    undone = await service.undo(updated, user.id)
    assert undone.title == "Undo Trip"

    versions = await service.versions(undone)
    assert len(versions) == 1  # the update's snapshot was consumed by undo


async def test_trip_budget(get_test_db: AsyncSession):
    """Test the budget calculation for a trip."""
    user = await _user(get_test_db, "test7@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create())

    budget = service.budget(trip)
    assert budget.total_planned == 0
    assert budget.total_booked == 0
    assert budget.remaining == budget.budget_total

    trip_with_day = await service.add_day(
        trip, user.id, TripDayIn(date=date(2025, 10, 2), title="Day 2")
    )
    day_id = trip_with_day.days[0].id
    trip_with_item = await service.add_item(
        trip_with_day,
        user.id,
        day_id,
        TripItemIn(
            name="Charles Bridge Tour",
            item_type="attraction",
            pricing={"price": "25.00"},
            source_type=SourceType.VERIFIED_LIVE,
        ),
    )

    budget = service.budget(trip_with_item)
    assert budget.total_planned == Decimal("25.00")
    assert budget.total_booked == Decimal("0.00")
    assert budget.remaining == budget.budget_total - Decimal("25.00")
    # Category rollup
    assert any(c.category == "activities" and c.planned == Decimal("25.00") for c in budget.categories)


async def test_trip_serialization(get_test_db: AsyncSession):
    """Test the serialization methods (to_read, to_summary, to_version)."""
    user = await _user(get_test_db, "test8@example.com")
    service = TripService(get_test_db)
    trip = await service.create(user, _trip_create(title="Serialization Trip"))

    trip_read = service.to_read(trip)
    assert trip_read.id == trip.id
    assert trip_read.title == "Serialization Trip"
    assert trip_read.budget is not None
    assert trip_read.budget.budget_total == Decimal("1000.00")

    trip_summary = service.to_summary(trip)
    assert trip_summary.id == trip.id
    assert trip_summary.destination_name == "Paris"

    # Force a version
    updated_trip = await service.update(trip, user.id, TripUpdate(title="For Version"))
    versions = await service.versions(updated_trip)
    assert len(versions) >= 1
    version = versions[0]
    version_read = service.to_version(version)
    assert version_read.id == version.id
    assert version_read.version_number == version.version_number
