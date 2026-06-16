"""Pydantic schemas — request/response shapes for all endpoints.

Models ORM return datetime fields and internal ID types; these schemas
flatten everything into JSON-safe primitives the frontend can consume.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Common ----------

class ORMBase(BaseModel):
    """Base for read schemas — read attributes from ORM objects."""
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------

class RegisterIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=4, max_length=40)
    password: str = Field(min_length=4, max_length=120)


class LoginIn(BaseModel):
    phone: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(ORMBase):
    id: str
    full_name: str
    phone: str
    role: str
    is_active: bool
    created_date: datetime
    updated_date: datetime


# ---------- DriverProfile ----------

class DriverProfileIn(BaseModel):
    user_id: str
    full_name: str
    phone: str
    telegram: Optional[str] = None
    truck_type: str
    capacity: float = 0
    current_location: Optional[str] = None
    destination: Optional[str] = None
    license_plate: Optional[str] = None


class DriverProfilePatch(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram: Optional[str] = None
    truck_type: Optional[str] = None
    capacity: Optional[float] = None
    current_location: Optional[str] = None
    destination: Optional[str] = None
    license_plate: Optional[str] = None
    is_verified: Optional[bool] = None


class DriverProfileOut(ORMBase):
    id: str
    user_id: str
    full_name: str
    phone: str
    telegram: Optional[str] = None
    truck_type: str
    capacity: float
    current_location: Optional[str] = None
    destination: Optional[str] = None
    license_plate: Optional[str] = None
    is_verified: bool
    rating: float
    trips_count: int
    created_date: datetime
    updated_date: datetime


# ---------- Load ----------

class LoadIn(BaseModel):
    from_location: str
    to_location: str
    cargo_type: str
    weight: Optional[float] = None
    volume: Optional[float] = None
    price: Optional[float] = None
    currency: str = "USD"
    contact_name: Optional[str] = None
    contact_phone: str
    telegram: Optional[str] = None
    transport_type: str = "har_qanday"
    description: Optional[str] = None
    load_date: Optional[str] = None
    status: str = "active"
    is_vip: bool = False
    is_highlight: bool = False
    is_pin: bool = False
    is_urgent: bool = False


class LoadPatch(BaseModel):
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    cargo_type: Optional[str] = None
    weight: Optional[float] = None
    volume: Optional[float] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    telegram: Optional[str] = None
    transport_type: Optional[str] = None
    description: Optional[str] = None
    load_date: Optional[str] = None
    status: Optional[str] = None
    is_vip: Optional[bool] = None
    is_highlight: Optional[bool] = None
    is_pin: Optional[bool] = None
    is_urgent: Optional[bool] = None
    priority_score: Optional[int] = None
    views: Optional[int] = None


class LoadOut(ORMBase):
    id: str
    from_location: str
    to_location: str
    cargo_type: str
    weight: Optional[float] = None
    volume: Optional[float] = None
    price: Optional[float] = None
    currency: str
    contact_name: Optional[str] = None
    contact_phone: str
    telegram: Optional[str] = None
    transport_type: str
    description: Optional[str] = None
    status: str
    shipper_id: str
    shipper_name: Optional[str] = None
    load_date: Optional[str] = None
    views: int
    is_vip: bool
    is_highlight: bool
    is_pin: bool
    is_urgent: bool
    priority_score: int
    created_date: datetime
    updated_date: datetime


# ---------- LoadApplication ----------

class ApplicationIn(BaseModel):
    load_id: str
    message: Optional[str] = None
    offered_price: Optional[float] = None


class ApplicationOut(ORMBase):
    id: str
    load_id: str
    driver_id: str
    driver_name: str
    driver_phone: str
    message: Optional[str] = None
    status: str
    offered_price: Optional[float] = None
    created_date: datetime
    updated_date: datetime


# ---------- ChatMessage ----------

class ChatMessageIn(BaseModel):
    load_id: str
    text: str = Field(min_length=1, max_length=2000)
    sender_role: Optional[str] = None  # 'driver' or 'shipper' — auto-detected if omitted


class ChatMessageOut(ORMBase):
    id: str
    load_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    text: str
    is_read: bool
    created_date: datetime
    updated_date: datetime


# ---------- Wallet ----------

class WalletOut(ORMBase):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    balance: float
    premium_active: bool
    premium_expires: Optional[datetime] = None
    created_date: datetime
    updated_date: datetime


class BuyCreditsIn(BaseModel):
    credits: int = Field(gt=0)
    label: str
    demo_amount: str


class SpendCreditsIn(BaseModel):
    amount: int = Field(gt=0)
    action_type: str
    label: str


class ActivatePremiumIn(BaseModel):
    pass


# ---------- AdminNotification ----------

class AdminNotificationOut(ORMBase):
    id: str
    user_id: str
    user_name: str
    user_phone: Optional[str] = None
    action_type: str
    item_label: str
    credits_spent: float
    credits_added: float
    demo_amount: Optional[str] = None
    is_read: bool
    created_date: datetime
    updated_date: datetime


# ---------- DeletedLoad ----------

class DeletedLoadOut(ORMBase):
    id: str
    original_id: str
    deleted_by_id: str
    deleted_by_name: Optional[str] = None
    deletion_time: datetime
    original_data: str
    created_date: datetime
    updated_date: datetime


# ---------- Admin ----------

class AdminStatsOut(BaseModel):
    total_loads: int
    active_loads: int
    total_users: int
    total_drivers: int
    total_views: int
    total_revenue: float
    premium_users: int
    today_credit_purchases: int
    today_vip_purchases: int


# Resolve forward references
TokenOut.model_rebuild()
