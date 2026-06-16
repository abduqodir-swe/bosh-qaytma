# Bo'sh Qaytma — Logistics Platform (UZ)

Mobile-first two-sided marketplace connecting drivers and cargo owners in Uzbekistan.
Drivers find return loads to avoid empty runs; shippers publish cargo with optional boosts
(VIP / Highlight / Pin / Urgent) and a credit-based wallet for promotions.

## Stack

- **Frontend:** React 18 + Vite + Tailwind + Radix UI + Framer Motion + FontAwesome
- **Backend:** FastAPI + SQLAlchemy 2 (async) + SQLite (aiosqlite) + JWT (python-jose) + bcrypt
- **Storage:** SQLite by default — switch `DATABASE_URL` to Postgres to scale

## Project layout

```
base44-app/
├── src/                  # Vite app
│   ├── api/apiClient.js  # Real backend HTTP client (replaces base44 mock)
│   ├── components/       # UI + feature components
│   ├── lib/              # Domain helpers (wallet, auth, constants, matching)
│   ├── pages/            # Home / Loads / PostLoad / LoadDetail / Profile / Admin / Chat
│   └── hooks/
├── backend/              # FastAPI app
│   ├── app/
│   │   ├── main.py       # entry + CORS + lifespan
│   │   ├── config.py     # pydantic settings (reads .env)
│   │   ├── db.py         # async SQLAlchemy engine + session + init_db
│   │   ├── security.py   # bcrypt + JWT issue/verify + FastAPI deps
│   │   ├── schemas.py    # Pydantic In/Out/Patch for every entity
│   │   ├── models/       # ORM models (AppUser, Load, Wallet, …)
│   │   ├── routers/      # auth, loads, applications, chat, wallet, driver_profile, admin
│   │   ├── services/     # Business logic (wallet credit accounting)
│   │   └── utils.py      # new_id() — 9-char base36 IDs
│   ├── .venv/
│   ├── requirements.txt
│   └── .env.example
└── entities/             # Original Base44 JSON schemas (kept for reference)
```

## Local development

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # tweak if needed
uvicorn app.main:app --reload --port 8000
```

- API root: <http://127.0.0.1:8000/health>
- Interactive docs: <http://127.0.0.1:8000/docs>
- SQLite DB file: `backend/bosqaytma.db` (auto-created on first start)

In dev mode, if `JWT_SECRET` is empty the app auto-generates a random key on
boot — **tokens invalidate on every restart**, which is the safest default.
Set `JWT_SECRET` in `.env` to keep tokens alive across restarts.

### 2. Frontend

```bash
npm install
npm run dev
```

- UI: <http://127.0.0.1:5174>
- Vite proxies `/api/*` to the FastAPI server, so the frontend never needs CORS
  config during local dev.

To point at a different backend, set `VITE_API_URL` before `npm run dev`.

## First user = admin

The very first registration on a fresh database is automatically promoted to
`role=admin`. After that, new users are created with `role=user`. Admins can
toggle their own role from the Profile screen, or an existing admin can
promote others from the Admin panel.

## Auth flow

- `POST /auth/register` — returns `{ access_token, user }` and creates an empty
  wallet for the new user.
- `POST /auth/login` — same shape, on bad password returns 401.
- `GET /auth/me` — requires `Authorization: Bearer <token>`, returns the user.
- Tokens are JWT (HS256) with a 7-day expiry. The client stores them in
  `localStorage` under `bq_token` and mirrors the user under `bq_local_user`.

## Entity surface

| Entity            | Path                | Notes                                                       |
|-------------------|---------------------|-------------------------------------------------------------|
| `Load`            | `/loads`            | List/get/create/patch/delete, plus `POST /loads/query` for arbitrary filters. Delete snapshots into `DeletedLoad`. |
| `DriverProfile`   | `/driver-profile`   | Per-user driver details. `GET /me` auto-creates empty.        |
| `LoadApplication` | `/applications`     | Driver applies to a load. `PATCH /:id/status?new_status=`.  |
| `ChatMessage`     | `/chat`             | `GET /chat/load/{loadId}` to list, `POST /chat` to send. Sender role auto-detected from load ownership. |
| `Wallet`          | `/wallet`           | `GET /me`, `POST /buy-credits`, `POST /spend`, `POST /activate-premium`. All mutations also create an `AdminNotification`. |
| `AdminNotification` | `/admin/notifications` | Admin-only read; for the admin dashboard feed.        |
| `DeletedLoad`     | `/admin/deleted-loads` | Soft-delete bin. `POST /:id/restore` brings the load back. |
| `AppUser`         | `/admin/users`      | Admin-only: list, patch (toggle `is_active` / `role`), delete. |

## Deployment notes

- Set `ENVIRONMENT=production` and a strong `JWT_SECRET` in the environment.
- Replace `DATABASE_URL` with a Postgres URL (e.g.
  `postgresql+asyncpg://user:pwd@host/db`) and run `alembic init` (TODO).
- The frontend builds with `npm run build`; serve the `dist/` folder behind
  any static host and point `VITE_API_URL` at the FastAPI host.

## License

Private.
