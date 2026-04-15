import pytest

from app.utils.validators import validate_password_strength


def test_password_without_uppercase_rejected() -> None:
    with pytest.raises(ValueError, match="mayuscula"):
        validate_password_strength("nouppercas3")


def test_password_without_number_rejected() -> None:
    with pytest.raises(ValueError, match="numero"):
        validate_password_strength("NoNumberHere")


def test_password_too_short_rejected() -> None:
    with pytest.raises(ValueError, match="8 caracteres"):
        validate_password_strength("Ab1")


def test_password_too_long_rejected() -> None:
    with pytest.raises(ValueError, match="128"):
        validate_password_strength("A1" + "a" * 127)


def test_password_without_lowercase_rejected() -> None:
    with pytest.raises(ValueError, match="minuscula"):
        validate_password_strength("NOLOWER123!")


def test_password_without_special_rejected() -> None:
    with pytest.raises(ValueError, match="caracter especial"):
        validate_password_strength("SecurePass123")


def test_valid_password_accepted() -> None:
    result = validate_password_strength("SecurePass123!")
    assert result == "SecurePass123!"


def test_minimum_valid_password() -> None:
    result = validate_password_strength("Abcdef1!")
    assert result == "Abcdef1!"
