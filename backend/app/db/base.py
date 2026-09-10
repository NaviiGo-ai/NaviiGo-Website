# ─── Declarative base, mixins, and JSON type ─────────────────────────────────
# One shared Base for the whole modular monolith. UUID primary keys + created_at
# / updated_at on every table (non-negotiable requirement from the spec).
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import MetaData, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import JSON, TypeDecorator

# Consistent index/constraint names so Alembic autogenerate diffs are stable
# across PostgreSQL and SQLite.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class JsonB(TypeDecorator):
    """JSON that stores as JSONB on PostgreSQL, plain JSON elsewhere (SQLite).

    Enables server-side JSON operators in production while keeping tests on
    SQLite fully hermetic.
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):  # noqa: D102
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(JSON())


class UUIDPrimaryKeyMixin:
    """Every table gets a UUID primary key (Postgres UUID / SQLite CHAR(32))."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TimestampMixin:
    """created_at is immutable; updated_at bumps on every change.

    func.now() renders as CURRENT_TIMESTAMP on SQLite and now() on Postgres,
    so the default is correct on both backends.
    """

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=lambda: datetime.now(timezone.utc)
    )
