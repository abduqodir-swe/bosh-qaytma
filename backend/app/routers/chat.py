"""Chat router — list messages for a load, send a new message."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.chat_message import ChatMessage
from app.models.load import Load
from app.schemas import ChatMessageIn, ChatMessageOut
from app.security import get_current_user
from app.utils import new_id


router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/load/{load_id}", response_model=list[ChatMessageOut])
async def list_messages(
    load_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    order_by: str = "created_date",
    limit: int = 200,
) -> list[ChatMessageOut]:
    stmt = select(ChatMessage).where(ChatMessage.load_id == load_id)
    is_desc = order_by.startswith("-")
    field = order_by[1:] if is_desc else order_by
    col = getattr(ChatMessage, field, ChatMessage.created_date)
    stmt = stmt.order_by(col.desc() if is_desc else col.asc())
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [ChatMessageOut.model_validate(r) for r in rows]


@router.post("", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    body: ChatMessageIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> ChatMessageOut:
    load = (await db.execute(select(Load).where(Load.id == body.load_id))).scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    # Auto-detect sender role if not provided
    sender_role = body.sender_role or ("shipper" if load.shipper_id == user.id else "driver")

    msg = ChatMessage(
        id=new_id(),
        load_id=body.load_id,
        sender_id=user.id,
        sender_name=user.full_name,
        sender_role=sender_role,
        text=body.text.strip(),
        is_read=False,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return ChatMessageOut.model_validate(msg)


@router.post("/{msg_id}/read", response_model=ChatMessageOut)
async def mark_read(
    msg_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> ChatMessageOut:
    msg = (await db.execute(select(ChatMessage).where(ChatMessage.id == msg_id))).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    # Only the recipient (not the sender) marks it read
    if msg.sender_id != user.id:
        msg.is_read = True
        await db.commit()
        await db.refresh(msg)
    return ChatMessageOut.model_validate(msg)
