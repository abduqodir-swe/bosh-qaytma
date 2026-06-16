"""Wallet router — get wallet, buy credits, spend credits, activate premium."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import (
    ActivatePremiumIn,
    BuyCreditsIn,
    SpendCreditsIn,
    WalletOut,
)
from app.security import get_current_user
from app.services import (
    activate_premium,
    add_credits,
    get_or_create_wallet,
    spend_credits,
)


router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/me", response_model=WalletOut)
async def my_wallet(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> WalletOut:
    wallet = await get_or_create_wallet(db, user)
    return WalletOut.model_validate(wallet)


@router.post("/buy-credits", response_model=WalletOut)
async def buy_credits(
    body: BuyCreditsIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> WalletOut:
    wallet = await get_or_create_wallet(db, user)
    wallet = await add_credits(db, wallet, user, body.credits, body.label, body.demo_amount)
    return WalletOut.model_validate(wallet)


@router.post("/spend", response_model=WalletOut)
async def spend(
    body: SpendCreditsIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[Any, Depends(get_current_user)],
) -> WalletOut:
    wallet = await get_or_create_wallet(db, user)
    wallet = await spend_credits(
        db, wallet, user, body.amount, body.action_type, body.label
    )
    return WalletOut.model_validate(wallet)


@router.post("/activate-premium", response_model=WalletOut)
async def activate_premium_endpoint(
    body: ActivatePremiumIn = ActivatePremiumIn(),  # noqa: B008
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    user: Annotated[Any, Depends(get_current_user)] = None,
) -> WalletOut:
    wallet = await get_or_create_wallet(db, user)
    wallet = await activate_premium(db, wallet, user)
    return WalletOut.model_validate(wallet)
