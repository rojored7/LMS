"""Utilidades para construccion segura de queries SQLAlchemy."""
import re

_LIKE_SPECIAL_CHARS = re.compile(r"([%_\\])")


def escape_like(value: str) -> str:
    """Escapa caracteres especiales de LIKE (%%, _, backslash) para prevenir LIKE injection."""
    return _LIKE_SPECIAL_CHARS.sub(r"\\\1", value)
