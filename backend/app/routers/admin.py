"""Admin router — stats, user/driver management, notifications, deleted loads.

All endpoints require an admin user (verified by require_admin dependency).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.admin_notification import AdminNotification
from app.models.app_user import AppUser
from app.models.deleted_load import DeletedLoad
from app.models.driver_profile import DriverProfile
from app.models.load import Load
from app.schemas import (
    AdminNotificationOut,
    AdminStatsOut,
    DeletedLoadOut,
    DriverProfileOut,
    DriverProfilePatch,
    LoadOut,
    UserOut,
)
from app.security import require_admin
from app.utils import new_id


router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)]
)


# ---------- Stats ----------

@router.get("/stats", response_model=AdminStatsOut)
async def stats(db: Annotated[AsyncSession, Depends(get_db)]) -> AdminStatsOut:
    total_loads = (await db.execute(select(func.count(Load.id)))).scalar_one()
    active_loads = (await db.execute(
        select(func.count(Load.id)).where(Load.status == "active")
    )).scalar_one()
    total_users = (await db.execute(select(func.count(AppUser.id)))).scalar_one()
    total_drivers = (await db.execute(select(func.count(DriverProfile.id)))).scalar_one()
    total_views = (await db.execute(select(func.coalesce(func.sum(Load.views), 0)))).scalar_one()
    total_revenue = (await db.execute(
        select(func.coalesce(func.sum(AdminNotification.credits_added), 0)).where(
            AdminNotification.action_type == "credit_purchase"
        )
    )).scalar_one()
    premium_users = (await db.execute(
        select(func.count(AdminNotification.id)).where(
            AdminNotification.action_type == "premium_purchase"
        )
    )).scalar_one()

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_credits = (await db.execute(
        select(func.count(AdminNotification.id)).where(
            AdminNotification.action_type == "credit_purchase",
            AdminNotification.created_date >= today_start,
        )
    )).scalar_one()
    today_vip = (await db.execute(
        select(func.count(AdminNotification.id)).where(
            AdminNotification.action_type == "vip_purchase",
            AdminNotification.created_date >= today_start,
        )
    )).scalar_one()

    return AdminStatsOut(
        total_loads=total_loads,
        active_loads=active_loads,
        total_users=total_users,
        total_drivers=total_drivers,
        total_views=int(total_views or 0),
        total_revenue=float(total_revenue or 0),
        premium_users=premium_users,
        today_credit_purchases=today_credits,
        today_vip_purchases=today_vip,
    )


# ---------- Users ----------

@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    order_by: str | None = "-created_date",
    limit: int = 200,
) -> list[UserOut]:
    stmt = select(AppUser)
    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(AppUser, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [UserOut.model_validate(r) for r in rows]


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    is_active: bool | None = None,
    role: str | None = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> UserOut:
    user = (await db.execute(select(AppUser).where(AppUser.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if is_active is not None:
        user.is_active = is_active
    if role is not None:
        if role not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
        user.role = role
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}", response_class=Response)
async def delete_user(
    user_id: str, db: Annotated[AsyncSession, Depends(get_db)]
) -> Response:
    user = (await db.execute(select(AppUser).where(AppUser.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return Response(status_code=204)


# ---------- Drivers ----------

@router.get("/drivers", response_model=list[DriverProfileOut])
async def list_drivers(
    db: Annotated[AsyncSession, Depends(get_db)],
    order_by: str | None = "-created_date",
    limit: int = 200,
) -> list[DriverProfileOut]:
    stmt = select(DriverProfile)
    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(DriverProfile, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [DriverProfileOut.model_validate(r) for r in rows]


@router.patch("/drivers/{driver_id}", response_model=DriverProfileOut)
async def update_driver(
    driver_id: str,
    body: DriverProfilePatch,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DriverProfileOut:
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.id == driver_id)
    )).scalar_one_or_none()
    if not prof:
        raise HTTPException(status_code=404, detail="Driver not found")
    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(prof, k, v)
    await db.commit()
    await db.refresh(prof)
    return DriverProfileOut.model_validate(prof)


@router.delete("/drivers/{driver_id}", response_class=Response)
async def delete_driver(
    driver_id: str, db: Annotated[AsyncSession, Depends(get_db)]
) -> Response:
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.id == driver_id)
    )).scalar_one_or_none()
    if not prof:
        raise HTTPException(status_code=404, detail="Driver not found")
    await db.delete(prof)
    await db.commit()
    return Response(status_code=204)


# ---------- Loads (admin oversight) ----------

@router.get("/loads", response_model=list[LoadOut])
async def list_all_loads(
    db: Annotated[AsyncSession, Depends(get_db)],
    order_by: str | None = "-created_date",
    limit: int = 200,
) -> list[LoadOut]:
    stmt = select(Load)
    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(Load, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [LoadOut.model_validate(r) for r in rows]


# ---------- Notifications ----------

@router.get("/notifications", response_model=list[AdminNotificationOut])
async def list_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    order_by: str | None = "-created_date",
    limit: int = 100,
    is_read: bool | None = None,
) -> list[AdminNotificationOut]:
    stmt = select(AdminNotification)
    if is_read is not None:
        stmt = stmt.where(AdminNotification.is_read == is_read)
    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(AdminNotification, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [AdminNotificationOut.model_validate(r) for r in rows]


@router.post("/notifications/{notif_id}/read", response_model=AdminNotificationOut)
async def mark_notification_read(
    notif_id: str, db: Annotated[AsyncSession, Depends(get_db)]
) -> AdminNotificationOut:
    notif = (await db.execute(
        select(AdminNotification).where(AdminNotification.id == notif_id)
    )).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return AdminNotificationOut.model_validate(notif)


# ---------- Deleted loads (trash bin) ----------

@router.get("/deleted-loads", response_model=list[DeletedLoadOut])
async def list_deleted_loads(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 200,
) -> list[DeletedLoadOut]:
    stmt = select(DeletedLoad).order_by(DeletedLoad.created_date.desc()).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [DeletedLoadOut.model_validate(r) for r in rows]


@router.delete("/deleted-loads/{deleted_id}", response_class=Response)
async def permanently_delete_load(
    deleted_id: str, db: Annotated[AsyncSession, Depends(get_db)]
) -> Response:
    row = (await db.execute(
        select(DeletedLoad).where(DeletedLoad.id == deleted_id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Deleted load not found")
    await db.delete(row)
    await db.commit()
    return Response(status_code=204)


@router.post("/deleted-loads/{deleted_id}/restore", response_model=LoadOut)
async def restore_deleted_load(
    deleted_id: str, db: Annotated[AsyncSession, Depends(get_db)]
) -> LoadOut:
    row = (await db.execute(
        select(DeletedLoad).where(DeletedLoad.id == deleted_id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Deleted load not found")
    try:
        original = json.loads(row.original_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Corrupted snapshot: {e}")

    # Strip identity fields so a new row is created cleanly
    for k in ("id", "created_date", "updated_date"):
        original.pop(k, None)
    original["status"] = "active"  # restored loads come back active

    new_load = Load(id=new_id(), **original)
    db.add(new_load)
    await db.delete(row)
    await db.commit()
    await db.refresh(new_load)
    return LoadOut.model_validate(new_load)
