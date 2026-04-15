from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.auth import _extract_token, _validate_token, get_optional_user
from app.middleware.error_handler import AuthenticationError
from app.models.user import User, UserRole
from app.services.token_service import TokenService


def test_extract_token_from_bearer_header() -> None:
    request = MagicMock()
    request.headers.get.return_value = "Bearer my-token-123"
    request.cookies.get.return_value = None
    assert _extract_token(request) == "my-token-123"


def test_extract_token_from_cookie() -> None:
    request = MagicMock()
    request.headers.get.return_value = None
    request.cookies.get.return_value = "cookie-token-456"
    assert _extract_token(request) == "cookie-token-456"


def test_extract_token_missing() -> None:
    request = MagicMock()
    request.headers.get.return_value = None
    request.cookies.get.return_value = None
    assert _extract_token(request) is None


def test_extract_token_bearer_priority_over_cookie() -> None:
    request = MagicMock()
    request.headers.get.return_value = "Bearer header-token"
    request.cookies.get.return_value = "cookie-token"
    assert _extract_token(request) == "header-token"


async def test_validate_token_blacklisted_raises() -> None:
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=True)
    db = AsyncMock(spec=AsyncSession)

    with pytest.raises(AuthenticationError, match="Token revocado"):
        await _validate_token("blacklisted-token", token_service, db)


async def test_validate_token_invalid_raises() -> None:
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=False)
    db = AsyncMock(spec=AsyncSession)

    with pytest.raises(AuthenticationError, match="Token invalido"):
        await _validate_token("garbage-token", token_service, db)


async def test_validate_token_mass_invalidated_raises() -> None:
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=False)
    token_service.are_user_tokens_invalidated = AsyncMock(return_value=True)

    valid_token = token_service.create_access_token("user1", "e@e.com", "STUDENT")

    db = AsyncMock(spec=AsyncSession)

    with pytest.raises(AuthenticationError, match="Sesion invalidada"):
        await _validate_token(valid_token, token_service, db)


async def test_validate_token_user_not_found_raises() -> None:
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=False)
    token_service.are_user_tokens_invalidated = AsyncMock(return_value=False)

    valid_token = token_service.create_access_token("user1", "e@e.com", "STUDENT")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db = AsyncMock(spec=AsyncSession)
    db.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(AuthenticationError, match="Usuario no encontrado"):
        await _validate_token(valid_token, token_service, db)


async def test_validate_token_success() -> None:
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=False)
    token_service.are_user_tokens_invalidated = AsyncMock(return_value=False)

    valid_token = token_service.create_access_token("user1", "e@e.com", "STUDENT")

    mock_user = User(id="user1", email="e@e.com", password_hash="h", name="Test", role=UserRole.STUDENT)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user
    db = AsyncMock(spec=AsyncSession)
    db.execute = AsyncMock(return_value=mock_result)

    user = await _validate_token(valid_token, token_service, db)
    assert user.id == "user1"
    assert user.email == "e@e.com"


async def test_optional_auth_returns_none_without_token() -> None:
    """CORRECCION: optional auth sin token retorna None, no falla."""
    request = MagicMock()
    request.headers.get.return_value = None
    request.cookies.get.return_value = None

    db = AsyncMock(spec=AsyncSession)
    token_service = TokenService(redis=AsyncMock())

    result = await get_optional_user(request, db, token_service)
    assert result is None


async def test_optional_auth_rejects_blacklisted_token() -> None:
    """CORRECCION: A diferencia de optionalAuth.ts en Express, este SI verifica blacklist."""
    token_service = TokenService(redis=AsyncMock())
    token_service.is_blacklisted = AsyncMock(return_value=True)
    valid_token = token_service.create_access_token("user1", "e@e.com", "STUDENT")

    request = MagicMock()
    request.headers.get.return_value = f"Bearer {valid_token}"
    request.cookies.get.return_value = None

    db = AsyncMock(spec=AsyncSession)

    result = await get_optional_user(request, db, token_service)
    assert result is None  # Returns None, not the user
