"""Common model utilities shared across all model files."""
from datetime import datetime, timezone
from uuid import uuid4


def gen_id() -> str:
    return uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
