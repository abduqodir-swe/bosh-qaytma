"""Load model — cargo listings posted by shippers."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Load(Base):
    __tablename__ = "loads"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    from_location: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    to_location: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    cargo_type: Mapped[str] = mapped_column(String(40), nullable=False)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    telegram: Mapped[str | None] = mapped_column(String(80), nullable=True)
    transport_type: Mapped[str] = mapped_column(String(30), nullable=False, default="har_qanday")
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    shipper_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    shipper_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    load_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Boosts
    is_vip: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_highlight: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_pin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    priority_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
