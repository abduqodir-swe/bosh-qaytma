"""Loads router — list / get / create / update / delete cargo listings.

The frontend uses a "list(filter, orderBy, limit)" pattern; we expose
both a GET /loads (with query params) and a POST /loads/query endpoint
for complex filters (mimics the Base44 SDK shape).
"""
from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.deleted_load import DeletedLoad
from app.models.load import Load
from app.schemas import LoadIn, LoadOut, LoadPatch
from app.security import get_current_user
from app.utils import new_id


router = APIRouter(prefix="/loads", tags=["loads"])


def _coerce_query_value(v: str) -> Any:
    """Try JSON decode, then fallback to string. Used for /loads/query body."""
    try:
        return json.loads(v)
    except (json.JSONDecodeError, TypeError):
        return v


@router.get("", response_model=list[LoadOut])
async def list_loads(
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
    cargo_type: str | None = None,
    transport_type: str | None = None,
    shipper_id: str | None = None,
    order_by: str | None = Query(default=None, description="Field, prefix '-' for desc"),
    limit: int = Query(default=100, le=500),
) -> list[LoadOut]:
    stmt = select(Load)
    if status_filter:
        stmt = stmt.where(Load.status == status_filter)
    if cargo_type:
        stmt = stmt.where(Load.cargo_type == cargo_type)
    if transport_type:
        stmt = stmt.where(Load.transport_type == transport_type)
    if shipper_id:
        stmt = stmt.where(Load.shipper_id == shipper_id)

    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(Load, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    else:
        stmt = stmt.order_by(Load.created_date.desc())

    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [LoadOut.model_validate(r) for r in rows]


@router.post("/query", response_model=list[LoadOut])
async def query_loads(
    db: Annotated[AsyncSession, Depends(get_db)],
    body: dict[str, Any] | None = None,
    order_by: str | None = None,
    limit: int = 100,
) -> list[LoadOut]:
    """Flexible filter — mimics Base44 SDK `entities.Load.filter({...}, orderBy, limit)`."""
    body = body or {}
    stmt = select(Load)

    # `filter` is a {field: value} dict for exact matches
    for key, value in body.items():
        col = getattr(Load, key, None)
        if col is not None:
            stmt = stmt.where(col == value)

    if order_by:
        is_desc = order_by.startswith("-")
        field = order_by[1:] if is_desc else order_by
        col = getattr(Load, field, None)
        if col is not None:
            stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    else:
        stmt = stmt.order_by(Load.created_date.desc())

    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [LoadOut.model_validate(r) for r in rows]


@router.get("/{load_id}", response_model=LoadOut)
async def get_load(load_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> LoadOut:
    row = (await db.execute(select(Load).where(Load.id == load_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Load not found")
    return LoadOut.model_validate(row)


@router.post("", response_model=LoadOut, status_code=status.HTTP_201_CREATED)
async def create_load(
    body: LoadIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> LoadOut:
    # Auto-populate shipper_id/name from auth
    data = body.model_dump()
    data["shipper_id"] = user.id
    data["shipper_name"] = user.full_name

    # Compute priority_score from boosts
    priority_score = 0
    if data.get("is_pin"):
        priority_score = max(priority_score, 5000)
    if data.get("is_urgent"):
        priority_score = max(priority_score, 4000)
    if data.get("is_vip"):
        priority_score = max(priority_score, 3000)
    if data.get("is_highlight"):
        priority_score = max(priority_score, 2000)
    data["priority_score"] = priority_score

    load = Load(id=new_id(), **data)
    db.add(load)
    await db.commit()
    await db.refresh(load)
    return LoadOut.model_validate(load)


@router.patch("/{load_id}", response_model=LoadOut)
async def update_load(
    load_id: str,
    body: LoadPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> LoadOut:
    row = (await db.execute(select(Load).where(Load.id == load_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Load not found")
    if row.shipper_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not the owner")

    updates = body.model_dump(exclude_unset=True)

    # Bump view counter via dedicated endpoint below — here we just allow it.
    if updates:
        for k, v in updates.items():
            setattr(row, k, v)
        # Re-derive priority_score if boost flags changed
        if any(k in updates for k in ("is_pin", "is_urgent", "is_vip", "is_highlight")):
            ps = 0
            if row.is_pin:
                ps = max(ps, 5000)
            if row.is_urgent:
                ps = max(ps, 4000)
            if row.is_vip:
                ps = max(ps, 3000)
            if row.is_highlight:
                ps = max(ps, 2000)
            row.priority_score = ps
        await db.commit()
        await db.refresh(row)
    return LoadOut.model_validate(row)


@router.post("/{load_id}/view", response_model=LoadOut)
async def increment_view(load_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> LoadOut:
    row = (await db.execute(select(Load).where(Load.id == load_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Load not found")
    row.views = (row.views or 0) + 1
    await db.commit()
    await db.refresh(row)
    return LoadOut.model_validate(row)


@router.delete("/{load_id}", response_class=Response)
async def delete_load(
    load_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> Response:
    row = (await db.execute(select(Load).where(Load.id == load_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Load not found")
    if row.shipper_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not the owner")

    # Snapshot before delete so admin can restore later
    snapshot = json.dumps(LoadOut.model_validate(row).model_dump(mode="json"), ensure_ascii=False)
    deleted = DeletedLoad(
        id=new_id(),
        original_id=row.id,
        deleted_by_id=user.id,
        deleted_by_name=user.full_name,
        deletion_time=row.updated_date,
        original_data=snapshot,
    )
    db.add(deleted)
    await db.delete(row)
    await db.commit()
    return Response(status_code=204)
