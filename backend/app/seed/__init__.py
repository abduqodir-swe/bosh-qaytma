"""Demo data seeder for Bo'sh Qaytma.

Idempotent: by default skips creation if the DB already has data.
Run with `python -m app.seed` to seed; add `--force` to wipe & re-seed.

Creates:
- 1 admin user (phone +998900000001, password admin123)
- 4 driver users with profiles
- 3 shipper users
- 8 sample loads across Uzbekistan, with a mix of boost tiers
- Bonus credits on each wallet (so boost purchases are visible)
- A few admin notifications (purchase + premium events)
- 1 sample chat thread on a load
"""
from __future__ import annotations

import asyncio
import json
import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal, init_db
from app.models.admin_notification import AdminNotification
from app.models.app_user import AppUser
from app.models.chat_message import ChatMessage
from app.models.driver_profile import DriverProfile
from app.models.load import Load
from app.models.wallet import Wallet
from app.security import hash_password
from app.utils import new_id


# --- demo data tables ----------------------------------------------------

USERS = [
    # admins
    {
        "full_name": "Demo Admin",
        "phone": "+998900000001",
        "password": "admin123",
        "role": "admin",
    },
    # shippers (грузоотправители)
    {
        "full_name": "Alisher Karimov",
        "phone": "+998901112233",
        "password": "demo1234",
        "role": "user",
    },
    {
        "full_name": "Dilshod Rahimov",
        "phone": "+998902223344",
        "password": "demo1234",
        "role": "user",
    },
    {
        "full_name": "Madina Yusupova",
        "phone": "+998903334455",
        "password": "demo1234",
        "role": "user",
    },
    # drivers (водители)
    {
        "full_name": "Bobur Tursunov",
        "phone": "+998905556677",
        "password": "demo1234",
        "role": "user",
    },
    {
        "full_name": "Sherzod Ergashev",
        "phone": "+998906667788",
        "password": "demo1234",
        "role": "user",
    },
    {
        "full_name": "Jasur Abdullaev",
        "phone": "+998907778899",
        "password": "demo1234",
        "role": "user",
    },
    {
        "full_name": "Otabek Mahmudov",
        "phone": "+998908889900",
        "password": "demo1234",
        "role": "user",
    },
]

DRIVERS = {
    # keyed by phone; each driver has a truck + route
    "+998905556677": {
        "truck_type": "tentli",
        "capacity": 20,
        "current_location": "Toshkent",
        "destination": "Samarqand",
        "license_plate": "01 A 777 AA",
        "is_verified": True,
        "rating": 4.9,
        "trips_count": 142,
        "telegram": "@bobur_driver",
    },
    "+998906667788": {
        "truck_type": "ref",
        "capacity": 10,
        "current_location": "Toshkent",
        "destination": "Buxoro",
        "license_plate": "10 B 444 BB",
        "is_verified": True,
        "rating": 4.7,
        "trips_count": 89,
        "telegram": "@sherzod_ref",
    },
    "+998907778899": {
        "truck_type": "bort",
        "capacity": 15,
        "current_location": "Andijon",
        "destination": "Toshkent",
        "license_plate": "30 C 999 CC",
        "is_verified": False,
        "rating": 4.3,
        "trips_count": 21,
        "telegram": "@jasur_bort",
    },
    "+998908889900": {
        "truck_type": "izoterm",
        "capacity": 8,
        "current_location": "Samarqand",
        "destination": "Toshkent",
        "license_plate": "20 D 555 DD",
        "is_verified": True,
        "rating": 4.8,
        "trips_count": 67,
        "telegram": "@otabek_izo",
    },
}

# Loads: each tuple is (from, to, cargo, weight, volume, price, transport, shipper_phone, boosts, desc, days_ago)
LOADS = [
    # — VIP
    (
        "Toshkent", "Samarqand", "qurilish_materiallari", 22.0, 45.0, 850, "USD",
        "+998901112233",
        {"is_vip": True, "is_highlight": True, "is_pin": False, "is_urgent": False},
        "Sement 22 tonna, palette ustida. Yuklash ertaga ertalab.",
        0,
    ),
    # — PIN (tepadada turish)
    (
        "Toshkent", "Buxoro", "oziq_ovqat", 8.5, 14.0, 620, "USD",
        "+998902223344",
        {"is_vip": False, "is_highlight": False, "is_pin": True, "is_urgent": False},
        "Sovutgichli transport kerak. 24 soat ichida yetkazish.",
        0,
    ),
    # — URGENT
    (
        "Andijon", "Toshkent", "tekstil", 3.2, 12.0, 280, "USD",
        "+998903334455",
        {"is_vip": False, "is_highlight": False, "is_pin": False, "is_urgent": True},
        "3 palub kiyimlar. Yuk tayyor, zudlik bilan haydovchi kerak.",
        1,
    ),
    # — HIGHLIGHT (ajralib turish)
    (
        "Toshkent", "Namangan", "mebel", 4.0, 18.0, 320, "USD",
        "+998901112233",
        {"is_vip": False, "is_highlight": True, "is_pin": False, "is_urgent": False},
        "Yumshoq mebel — divan, kreslo, stol. Ehtiyot tashish kerak.",
        1,
    ),
    # — ZARIL (top + ajralib)
    (
        "Samarqand", "Toshkent", "elektronika", 1.8, 5.0, 540, "USD",
        "+998902223344",
        {"is_vip": True, "is_highlight": True, "is_pin": True, "is_urgent": True},
        "Server uskunalari, original qadoqda. 1 kunlik shoshilinch yetkazish.",
        0,
    ),
    # — Normal
    (
        "Toshkent", "Farg'ona", "qishloq_xojaligi", 18.0, 36.0, 540, "USD",
        "+998903334455",
        {"is_vip": False, "is_highlight": False, "is_pin": False, "is_urgent": False},
        "Paxta, quruq, 18 tonna. Yuklash bugun 18:00 da.",
        2,
    ),
    (
        "Buxoro", "Toshkent", "kimyo", 12.0, 22.0, 480, "USD",
        "+998901112233",
        {"is_vip": False, "is_highlight": False, "is_pin": False, "is_urgent": False},
        "Bo'yoq materiallari, quruq, dezhen ostida. Ehtiyot.",
        3,
    ),
    (
        "Toshkent", "Qarshi", "avtomobil_qismlari", 6.5, 9.0, 290, "USD",
        "+998902223344",
        {"is_vip": False, "is_highlight": False, "is_pin": False, "is_urgent": False},
        "Yangi avto ehtiyot qismlar, original. 4 dona karton.",
        2,
    ),
]

CHAT = [
    # load_id will be resolved at seed time (first load)
    ("+998901112233", "Salom! Yukingiz ko'rinib turibdi, Toshkentdan Samarqandga. Qabul qila olaman, ertalab 7 da yetib boraman.", "shipper"),
    ("+998905556677", "Yaxshi, men siz bilan 5 minut ichida bog'lanaman. Yukning rasmini yuboring iltimos.", "driver"),
    ("+998901112233", "Hozir yuboraman. Narxlar bo'yicha 800 USD gaplashamizmi?", "shipper"),
]


# --- helpers -------------------------------------------------------------

def compute_priority(boosts: dict) -> int:
    score = 0
    if boosts.get("is_pin"):
        score = max(score, 5000)
    if boosts.get("is_urgent"):
        score = max(score, 4000)
    if boosts.get("is_vip"):
        score = max(score, 3000)
    if boosts.get("is_highlight"):
        score = max(score, 2000)
    return score


async def has_data(db: AsyncSession) -> bool:
    """Skip if there's any user (most likely seeded)."""
    res = await db.execute(select(AppUser.id).limit(1))
    return res.scalar_one_or_none() is not None


async def wipe(db: AsyncSession) -> None:
    """Clear every table in FK-safe order."""
    for model in (
        AdminNotification,
        ChatMessage,
        Wallet,
        Load,
        DriverProfile,
        AppUser,
    ):
        await db.execute(model.__table__.delete())
    await db.commit()


async def seed_users(db: AsyncSession) -> dict[str, AppUser]:
    """Create all users, return phone → AppUser map."""
    by_phone: dict[str, AppUser] = {}
    for u in USERS:
        user = AppUser(
            id=new_id(),
            full_name=u["full_name"],
            phone=u["phone"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            is_active=True,
        )
        db.add(user)
        by_phone[u["phone"]] = user
    await db.flush()
    return by_phone


async def seed_wallets(
    db: AsyncSession, by_phone: dict[str, AppUser], with_bonus: dict[str, int]
) -> dict[str, Wallet]:
    by_user: dict[str, Wallet] = {}
    for phone, user in by_phone.items():
        balance = with_bonus.get(phone, 0)
        wallet = Wallet(
            id=new_id(),
            user_id=user.id,
            user_name=user.full_name,
            user_phone=user.phone,
            balance=balance,
            premium_active=False,
        )
        db.add(wallet)
        by_user[phone] = wallet
    await db.flush()
    return by_user


async def seed_drivers(
    db: AsyncSession, by_phone: dict[str, AppUser]
) -> dict[str, DriverProfile]:
    by_user: dict[str, DriverProfile] = {}
    for phone, data in DRIVERS.items():
        user = by_phone[phone]
        prof = DriverProfile(
            id=new_id(),
            user_id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            telegram=data.get("telegram"),
            truck_type=data["truck_type"],
            capacity=data["capacity"],
            current_location=data["current_location"],
            destination=data["destination"],
            license_plate=data.get("license_plate"),
            is_verified=data.get("is_verified", False),
            rating=data.get("rating", 0),
            trips_count=data.get("trips_count", 0),
        )
        db.add(prof)
        by_user[phone] = prof
    await db.flush()
    return by_user


async def seed_loads(
    db: AsyncSession, by_phone: dict[str, AppUser]
) -> list[Load]:
    loads: list[Load] = []
    now = datetime.now(timezone.utc)
    for (
        from_loc, to_loc, cargo, weight, volume, price, currency,
        shipper_phone, boosts, desc, days_ago,
    ) in LOADS:
        shipper = by_phone[shipper_phone]
        load = Load(
            id=new_id(),
            from_location=from_loc,
            to_location=to_loc,
            cargo_type=cargo,
            weight=weight,
            volume=volume,
            price=price,
            currency=currency,
            contact_name=shipper.full_name,
            contact_phone=shipper.phone,
            telegram="@alisher_logistics",
            transport_type="har_qanday",
            description=desc,
            status="active",
            shipper_id=shipper.id,
            shipper_name=shipper.full_name,
            load_date=(now + timedelta(days=1)).date().isoformat(),
            views=random.randint(5, 80),
            is_vip=boosts.get("is_vip", False),
            is_highlight=boosts.get("is_highlight", False),
            is_pin=boosts.get("is_pin", False),
            is_urgent=boosts.get("is_urgent", False),
            priority_score=compute_priority(boosts),
        )
        # Backdate created_date so it matches the "days_ago" hint
        load.created_date = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        load.updated_date = load.created_date
        db.add(load)
        loads.append(load)
    await db.flush()
    return loads


async def seed_admin_notifications(
    db: AsyncSession, by_phone: dict[str, AppUser], by_user_wallet: dict[str, Wallet]
) -> None:
    """Simulate a few purchase / boost / premium events so the admin bell has content."""
    now = datetime.now(timezone.utc)
    # Simulate a few boost purchases across users
    sample = [
        # (phone, action, label, credits_spent, credits_added, demo, hours_ago)
        ("+998901112233", "vip_purchase",       "VIP xarid (1 yuk)",           2, 0, "10,000 so'm", 0.5),
        ("+998901112233", "highlight_purchase", "Ajralib turish (1 yuk)",      1, 0, "5,000 so'm",  1.2),
        ("+998902223344", "pin_purchase",       "Tepadada turish (24 soat)",   4, 0, "20,000 so'm", 0.3),
        ("+998903334455", "urgent_purchase",    "Shoshilinch (1 yuk)",         5, 0, "25,000 so'm", 2.0),
        ("+998901112233", "credit_purchase",    "50 bonus to'plami",           0, 50,"25,000 so'm", 3.0),
        ("+998902223344", "credit_purchase",    "120 bonus to'plami",          0, 120,"40,000 so'm", 4.0),
        ("+998903334455", "credit_purchase",    "20 bonus to'plami",           0, 20,"10,000 so'm", 0.1),
        ("+998905556677", "credit_purchase",    "350 bonus to'plami",          0, 350,"100,000 so'm", 0.05),
        ("+998906667788", "premium_purchase",   "Premium obuna (30 kun)",      20, 0, "200,000 so'm", 1.5),
    ]
    for phone, action, label, spent, added, demo, hours in sample:
        u = by_phone[phone]
        w = by_user_wallet[phone]
        n = AdminNotification(
            id=new_id(),
            user_id=u.id,
            user_name=u.full_name,
            user_phone=u.phone,
            action_type=action,
            item_label=label,
            credits_spent=spent,
            credits_added=added,
            demo_amount=demo,
            is_read=random.random() < 0.3,
        )
        n.created_date = now - timedelta(hours=hours)
        n.updated_date = n.created_date
        db.add(n)
    await db.flush()


async def seed_chat(
    db: AsyncSession, by_phone: dict[str, AppUser], loads: list[Load]
) -> None:
    """One sample chat thread on the first load, between shipper & a driver."""
    target_load = loads[0]
    now = datetime.now(timezone.utc)
    for i, (phone, text, role) in enumerate(CHAT):
        u = by_phone[phone]
        msg = ChatMessage(
            id=new_id(),
            load_id=target_load.id,
            sender_id=u.id,
            sender_name=u.full_name,
            sender_role=role,
            text=text,
            is_read=i < 1,
        )
        msg.created_date = now - timedelta(minutes=10 - i * 3)
        msg.updated_date = msg.created_date
        db.add(msg)
    await db.flush()


async def run(force: bool = False) -> None:
    await init_db()
    async with SessionLocal() as db:
        if not force and await has_data(db):
            print("DB already has data — skipping. Re-run with --force to wipe & re-seed.")
            return
        if force:
            print("Wiping existing data...")
            await wipe(db)

        print("Seeding users...")
        by_phone = await seed_users(db)

        # Bonus credits on each wallet (so demo can buy boosts)
        bonus = {
            "+998901112233": 50,   # shipper #1 — can buy VIP etc.
            "+998902223344": 30,   # shipper #2
            "+998903334455": 20,   # shipper #3
            "+998905556677": 10,   # driver
            "+998906667788": 5,    # driver
            "+998907778899": 0,    # driver
            "+998908889900": 0,    # driver
        }
        # Admin wallet gets lots of credits for testing
        bonus["+998900000001"] = 100

        print("Seeding wallets...")
        by_user_wallet = await seed_wallets(db, by_phone, bonus)

        print("Seeding driver profiles...")
        await seed_drivers(db, by_phone)

        print("Seeding loads...")
        loads = await seed_loads(db, by_phone)

        print("Seeding admin notifications...")
        await seed_admin_notifications(db, by_phone, by_user_wallet)

        print("Seeding sample chat thread...")
        await seed_chat(db, by_phone, loads)

        await db.commit()
        print("Done!")
        print("")
        print("Demo accounts (phone / password):")
        print("  Admin   : +998900000001 / admin123")
        print("  Shipper : +998901112233 / demo1234  (Alisher Karimov, 50 bonus)")
        print("  Shipper : +998902223344 / demo1234  (Dilshod Rahimov, 30 bonus)")
        print("  Shipper : +998903334455 / demo1234  (Madina Yusupova, 20 bonus)")
        print("  Driver  : +998905556677 / demo1234  (Bobur Tursunov, verified)")
        print("  Driver  : +998906667788 / demo1234  (Sherzod Ergashev, verified)")
        print("  Driver  : +998907778899 / demo1234  (Jasur Abdullaev)")
        print("  Driver  : +998908889900 / demo1234  (Otabek Mahmudov, verified)")


def main() -> None:
    force = "--force" in sys.argv
    asyncio.run(run(force=force))


if __name__ == "__main__":
    main()
