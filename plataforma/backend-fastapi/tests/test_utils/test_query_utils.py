"""Tests para escape_like: verifica que % _ \ se escapan correctamente para LIKE injection."""
import pytest

from app.utils.query_utils import escape_like


def test_escape_percent() -> None:
    assert escape_like("a%b") == r"a\%b"


def test_escape_underscore() -> None:
    assert escape_like("a_b") == r"a\_b"


def test_escape_backslash() -> None:
    assert escape_like("a\\b") == r"a\\b"


def test_escape_multiple_specials() -> None:
    assert escape_like("%admin%") == r"\%admin\%"


def test_no_escape_normal_text() -> None:
    assert escape_like("Juan Perez") == "Juan Perez"


def test_empty_string() -> None:
    assert escape_like("") == ""
