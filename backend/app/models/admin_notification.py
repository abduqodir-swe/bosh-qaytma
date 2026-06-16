"""AdminNotification model — log of every credit/boost/premium purchase."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AdminNotification(Base):
    __tablename__ = "admin_notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    user_name: Mapped[str] = mapped_column(String(120), nullable=False)
    user_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    action_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    item_label: Mapped[str] = mapped_column(String(120), nullable=False)
    credits_spent: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    credits_added: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    demo_amount: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
