"""Wallet business logic — credit accounting + premium subscription.

All mutations also create an AdminNotification row so the admin dashboard
shows every financial action in real time.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_notification import AdminNotification
from app.models.app_user import AppUser
from app.models.wallet import Wallet
from app.utils import new_id


async def get_or_create_wallet(db: AsyncSession, user: AppUser) -> Wallet:
    existing = (await db.execute(
        select(Wallet).where(Wallet.user_id == user.id)
    )).scalar_one_or_none()
    if existing:
        return existing
    wallet = Wallet(
        id=new_id(),
        user_id=user.id,
        user_name=user.full_name,
        user_phone=user.phone,
        balance=0,
        premium_active=False,
    )
    db.add(wallet)
    await db.commit()
    await db.refresh(wallet)
    return wallet


async def add_credits(
    db: AsyncSession,
    wallet: Wallet,
    user: AppUser,
    credits: int,
    label: str,
    demo_amount: str,
) -> Wallet:
    """Top up balance. Always succeeds; just increments + logs a notification."""
    wallet.balance = (wallet.balance or 0) + credits
    notif = AdminNotification(
        id=new_id(),
        user_id=user.id,
        user_name=user.full_name,
        user_phone=wallet.user_phone or user.phone,
        action_type="credit_purchase",
        item_label=label,
        credits_added=credits,
        credits_spent=0,
        demo_amount=demo_amount,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(wallet)
    return wallet


async def spend_credits(
    db: AsyncSession,
    wallet: Wallet,
    user: AppUser,
    amount: int,
    action_type: str,
    label: str,
) -> Wallet:
    """Deduct credits. Raises 402 if balance is insufficient."""
    if (wallet.balance or 0) < amount:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    wallet.balance = wallet.balance - amount
    notif = AdminNotification(
        id=new_id(),
        user_id=user.id,
        user_name=user.full_name,
        user_phone=wallet.user_phone or user.phone,
        action_type=action_type,
        item_label=label,
        credits_spent=amount,
        credits_added=0,
        demo_amount="",
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(wallet)
    return wallet


async def activate_premium(
    db: AsyncSession, wallet: Wallet, user: AppUser
) -> Wallet:
    """Activate (or extend) Premium for 30 days. Cost: 20 credits."""
    if (wallet.balance or 0) < 20:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    wallet.balance = max(0, (wallet.balance or 0) - 20)

    # Extend if already active, else start fresh from now
    base = wallet.premium_expires
    if base and base > datetime.now(timezone.utc):
        new_expires = base + timedelta(days=30)
    else:
        new_expires = datetime.now(timezone.utc) + timedelta(days=30)
    wallet.premium_expires = new_expires
    wallet.premium_active = True

    notif = AdminNotification(
        id=new_id(),
        user_id=user.id,
        user_name=user.full_name,
        user_phone=wallet.user_phone or user.phone,
        action_type="premium_purchase",
        item_label="Premium obuna (30 kun)",
        credits_spent=20,
        credits_added=0,
        demo_amount="200,000 so'm",
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(wallet)
    return wallet
