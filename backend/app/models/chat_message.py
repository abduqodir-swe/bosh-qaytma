"""ChatMessage model — chat between driver and shipper for a specific load."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    load_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    sender_name: Mapped[str] = mapped_column(String(120), nullable=False)
    sender_role: Mapped[str] = mapped_column(String(20), nullable=False, default="driver")
    text: Mapped[str] = mapped_column(String(2000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
