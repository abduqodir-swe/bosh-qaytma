"""DriverProfile model — driver-specific details (truck, route, etc.)."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    telegram: Mapped[str | None] = mapped_column(String(80), nullable=True)
    truck_type: Mapped[str] = mapped_column(String(30), nullable=False)
    capacity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    current_location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(120), nullable=True)
    license_plate: Mapped[str | None] = mapped_column(String(40), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    trips_count: Mapped[int] = mapped_column(default=0, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
