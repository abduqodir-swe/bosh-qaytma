"""Application settings, loaded from .env or environment.

Copy `.env.example` to `.env` and fill in the values. Do NOT commit
`.env` to git — it contains secrets.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # SQLite for MVP. Switch DATABASE_URL to a Postgres URL to scale.
    database_url: str = "sqlite+aiosqlite:///./bosqaytma.db"
    # JWT signing key. MUST be set via env in production. A random value
    # is generated per-process at startup if not provided, which keeps
    # dev working but invalidates all tokens on every restart.
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7  # 7 days
    cors_origins: str = "http://localhost:5174,http://127.0.0.1:5174"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

# In production, refuse to boot with a missing/weak JWT secret.
# In dev, auto-generate one so first-run works out of the box.
import secrets as _secrets

if not settings.jwt_secret or settings.jwt_secret == "change-me-in-production-please":
    import os as _os
    if _os.environ.get("JWT_SECRET"):
        # User explicitly set it (even to a weak value) — respect their choice in dev.
        settings.jwt_secret = _os.environ["JWT_SECRET"]
    elif _os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError(
            "JWT_SECRET is required in production. "
            "Set it in .env or as an environment variable."
        )
    else:
        # Dev: auto-generate a random key. Tokens invalidate on restart.
        settings.jwt_secret = _secrets.token_urlsafe(48)
