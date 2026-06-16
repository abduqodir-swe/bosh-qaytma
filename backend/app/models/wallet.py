"""Wallet model — bonus balance + premium subscription per user."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    user_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    user_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    balance: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    premium_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    premium_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
