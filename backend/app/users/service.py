# ─── User helpers ────────────────────────────────────────────────────────────
# Identity lives in Firebase Auth; this table is a profile mirror for the
# transactional layer. get_or_create_user bridges the two: it maps a verified
# Firebase UID to a stable PostgreSQL user row.
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User


async def get_or_create_user(db: AsyncSession, firebase_uid: str) -> User:
    """Return the User row for a verified Firebase UID, creating it if new."""
    user = await db.scalar(select(User).where(User.firebase_uid == firebase_uid))
    if user is None:
        user = User(firebase_uid=firebase_uid)
        db.add(user)
        await db.flush()
    return user
