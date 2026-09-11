import pytest
import pytest_asyncio
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db import models  # ensure all models are registered on Base.metadata


@pytest_asyncio.fixture
async def get_test_db() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    TestingSessionLocal = sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )

    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
        await engine.dispose()
