# ─── Domain models package ───────────────────────────────────────────────────
# Importing this package registers every model on Base.metadata so Alembic
# autogenerate and Base.metadata.create_all see the full schema.
from __future__ import annotations

from app.db.base import Base

from app.db.models import enums  # noqa: F401
from app.db.models.user import User  # noqa: F401
from app.db.models.trip import (  # noqa: F401
    SavedTrip,
    Trip,
    TripDay,
    TripItem,
    TripPreference,
    TripVersion,
)
from app.db.models.supplier import (  # noqa: F401
    Supplier,
    SupplierOffer,
    SupplierTransaction,
)
from app.db.models.booking import Booking, BookingItem  # noqa: F401
from app.db.models.payment import (  # noqa: F401
    Payment,
    PaymentAttempt,
    Refund,
)
from app.db.models.review import Review  # noqa: F401
from app.db.models.event import TripEvent, UserEvent  # noqa: F401

__all__ = [
    "Base",
    "User",
    "Trip",
    "TripPreference",
    "TripDay",
    "TripItem",
    "TripVersion",
    "SavedTrip",
    "Supplier",
    "SupplierOffer",
    "SupplierTransaction",
    "Booking",
    "BookingItem",
    "Payment",
    "PaymentAttempt",
    "Refund",
    "Review",
    "TripEvent",
    "UserEvent",
]
