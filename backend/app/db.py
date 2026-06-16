"""Async SQLAlchemy engine + session factory."""
from __future__ import annotations

from collections.abc import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: yields a session and ensures it's closed."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables. Safe to call on every startup — only creates missing ones."""
    # Import models so they register on Base.metadata
    from app.models import (  # noqa: F401
        app_user,
        driver_profile,
        load,
        load_application,
        chat_message,
        wallet,
        deleted_load,
        admin_notification,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
