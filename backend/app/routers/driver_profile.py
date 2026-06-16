"""Driver profile router — drivers manage their own profile."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.driver_profile import DriverProfile
from app.schemas import DriverProfileIn, DriverProfileOut, DriverProfilePatch
from app.security import get_current_user
from app.utils import new_id


router = APIRouter(prefix="/driver-profile", tags=["driver-profile"])


@router.get("/me", response_model=DriverProfileOut)
async def my_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> DriverProfileOut:
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user.id)
    )).scalar_one_or_none()
    if not prof:
        # Auto-create empty profile
        prof = DriverProfile(
            id=new_id(),
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            truck_type="tentli",
            capacity=0,
        )
        db.add(prof)
        await db.commit()
        await db.refresh(prof)
    return DriverProfileOut.model_validate(prof)


@router.post("", response_model=DriverProfileOut)
async def upsert_profile(
    body: DriverProfileIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> DriverProfileOut:
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user.id)
    )).scalar_one_or_none()
    if prof:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(prof, k, v)
    else:
        prof = DriverProfile(id=new_id(), **body.model_dump())
        db.add(prof)
    await db.commit()
    await db.refresh(prof)
    return DriverProfileOut.model_validate(prof)


@router.patch("/me", response_model=DriverProfileOut)
async def patch_profile(
    body: DriverProfilePatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> DriverProfileOut:
    prof = (await db.execute(
        select(DriverProfile).where(DriverProfile.user_id == user.id)
    )).scalar_one_or_none()
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found. POST /driver-profile first.")
    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(prof, k, v)
    await db.commit()
    await db.refresh(prof)
    return DriverProfileOut.model_validate(prof)
