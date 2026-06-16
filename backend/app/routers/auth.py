"""Auth router — register, login, /me, change role (admin only)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.app_user import AppUser
from app.models.wallet import Wallet
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from app.utils import new_id


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenOut:
    # Check for existing phone
    existing = await db.execute(select(AppUser).where(AppUser.phone == body.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Phone already registered"
        )

    # First user ever becomes admin automatically
    count_res = await db.execute(select(AppUser.id))
    is_first_user = len(count_res.all()) == 0

    user = AppUser(
        id=new_id(),
        full_name=body.full_name.strip(),
        phone=body.phone.strip(),
        password_hash=hash_password(body.password),
        role="admin" if is_first_user else "user",
        is_active=True,
    )
    db.add(user)
    await db.flush()  # ensure user.id is populated

    # Auto-create wallet for new users
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
    await db.refresh(user)

    token = create_access_token(user.id, extra={"role": user.role})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenOut:
    result = await db.execute(select(AppUser).where(AppUser.phone == body.phone.strip()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Phone or password incorrect"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is blocked")
    token = create_access_token(user.id, extra={"role": user.role})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: Annotated[AppUser, Depends(get_current_user)]) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/logout")
async def logout() -> dict:
    """JWT is stateless — the client just discards the token. Endpoint exists
    for symmetry with the localStorage-era auth flow."""
    return {"ok": True}


# Admin-only: change a user's role
@router.patch("/users/{user_id}/role", response_model=UserOut, dependencies=[Depends(require_admin)])
async def change_role(
    user_id: str,
    new_role: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    if new_role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    result = await db.execute(select(AppUser).where(AppUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)
