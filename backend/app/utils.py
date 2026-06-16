"""Shared helpers used across routers/services."""
from __future__ import annotations

import secrets
import string

# 9 chars from base36 — matches the old localStorage mock ID format.
_ID_ALPHABET = string.ascii_lowercase + string.digits


def new_id(length: int = 9) -> str:
    return "".join(secrets.choice(_ID_ALPHABET) for _ in range(length))
