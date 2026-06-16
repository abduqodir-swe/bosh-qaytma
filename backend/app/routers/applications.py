"""Applications router — driver applies to a load."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.driver_profile import DriverProfile
from app.models.load import Load
from app.models.load_application import LoadApplication
from app.schemas import ApplicationIn, ApplicationOut
from app.security import get_current_user
from app.utils import new_id


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationOut])
async def list_applications(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
    load_id: str | None = None,
    driver_id: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[ApplicationOut]:
    stmt = select(LoadApplication)
    if load_id:
        stmt = stmt.where(LoadApplication.load_id == load_id)
    if driver_id:
        stmt = stmt.where(LoadApplication.driver_id == driver_id)
    if status_filter:
        stmt = stmt.where(LoadApplication.status == status_filter)
    # Drivers see only their own; admins see all
    if user.role != "admin":
        stmt = stmt.where(LoadApplication.driver_id == user.id)
    stmt = stmt.order_by(LoadApplication.created_date.desc())
    rows = (await db.execute(stmt)).scalars().all()
    return [ApplicationOut.model_validate(r) for r in rows]


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    body: ApplicationIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> ApplicationOut:
    # Verify load exists
    load = (await db.execute(select(Load).where(Load.id == body.load_id))).scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    # Try to get the driver's profile for phone/name
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user.id)
    )).scalar_one_or_none()
    driver_name = prof.full_name if prof else user.full_name
    driver_phone = prof.phone if prof else user.phone

    # Prevent duplicate applications
    existing = (await db.execute(
        select(LoadApplication).where(
            LoadApplication.load_id == body.load_id,
            LoadApplication.driver_id == user.id,
        )
    )).scalar_one_or_none()
    if existing:
        # Update message/price but keep status
        existing.message = body.message
        if body.offered_price is not None:
            existing.offered_price = body.offered_price
        await db.commit()
        await db.refresh(existing)
        return ApplicationOut.model_validate(existing)

    app_row = LoadApplication(
        id=new_id(),
        load_id=body.load_id,
        driver_id=user.id,
        driver_name=driver_name,
        driver_phone=driver_phone,
        message=body.message,
        status="pending",
        offered_price=body.offered_price,
    )
    db.add(app_row)
    await db.commit()
    await db.refresh(app_row)
    return ApplicationOut.model_validate(app_row)


@router.patch("/{app_id}/status", response_model=ApplicationOut)
async def set_status(
    app_id: str,
    new_status: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> ApplicationOut:
    if new_status not in ("pending", "accepted", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    app_row = (await db.execute(
        select(LoadApplication).where(LoadApplication.id == app_id)
    )).scalar_one_or_none()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    # Only the load owner or admin can change status
    load = (await db.execute(select(Load).where(Load.id == app_row.load_id))).scalar_one_or_none()
    if not load or (load.shipper_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    app_row.status = new_status
    await db.commit()
    await db.refresh(app_row)
    return ApplicationOut.model_validate(app_row)
