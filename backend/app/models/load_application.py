"""LoadApplication model — driver's application to a load."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class LoadApplication(Base):
    __tablename__ = "load_applications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    load_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    driver_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    driver_name: Mapped[str] = mapped_column(String(120), nullable=False)
    driver_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    offered_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )
