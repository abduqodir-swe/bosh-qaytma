"""DeletedLoad model — soft-delete snapshot so admin can restore."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DeletedLoad(Base):
    __tablename__ = "deleted_loads"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    original_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    deleted_by_id: Mapped[str] = mapped_column(String(32), nullable=False)
    deleted_by_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    deletion_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    # Full JSON snapshot of the original Load row.
    original_data: Mapped[str] = mapped_column(String(8000), nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
