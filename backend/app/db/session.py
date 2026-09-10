# ─── Async engine + session factory ──────────────────────────────────────────
# PostgreSQL is the canonical transactional store; SQLite (aiosqlite) keeps
# tests and local dev hermetic. The factory is created lazily so tests can
# override DATABASE_URL before first use.
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _async_url(url: str) -> str:
    """Translate a sync DATABASE_URL to the async driver URL."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite:///"):
        # sqlite:///./naviigo.db -> sqlite+aiosqlite:///./naviigo.db
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return url


def get_engine():
    """Return the lazily-initialized async engine."""
    global _engine, _session_factory
    if _engine is None:
        settings = get_settings()
        url = _async_url(settings.database_engine_url)
        connect_args = {}
        if url.startswith("sqlite"):
            # Allow use across threads; SQLite file DB for local dev.
            connect_args = {"check_same_thread": False}
        logger.info("Initializing database engine", extra={"engine": url.split("://")[0]})
        _engine = create_async_engine(
            url,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            connect_args=connect_args,
        )
        _session_factory = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    if _session_factory is None:
        get_engine()
    assert _session_factory is not None
    return _session_factory


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: one session per request, committed/closed by caller."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def init_models() -> None:
    """Create all tables (used by tests/local dev). Migrations are the prod path."""
    from app.db import models  # noqa: F401  (ensure models are registered)

    async with get_engine().begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)


async def dispose_engine() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
