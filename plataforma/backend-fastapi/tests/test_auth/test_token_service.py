from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest

from app.services.token_service import TokenService, BLACKLIST_PREFIX, INVALIDATE_PREFIX
from app.config import get_settings

settings = get_settings()


@pytest.fixture
def token_service() -> TokenService:
    mock_redis = AsyncMock()
    return TokenService(redis=mock_redis)


def test_create_access_token(token_service: TokenService) -> None:
    token = token_service.create_access_token(
        user_id="user123",
        email="test@test.com",
        role="STUDENT",
    )
    assert isinstance(token, str)
    assert len(token) > 50


def test_create_refresh_token(token_service: TokenService) -> None:
    token = token_service.create_refresh_token(
        user_id="user123",
    )
    assert isinstance(token, str)
    assert len(token) > 50


def test_verify_valid_access_token(token_service: TokenService) -> None:
    token = token_service.create_access_token(
        user_id="user123",
        email="test@test.com",
        role="STUDENT",
    )
    payload = token_service.verify_access_token(token)
    assert payload["user_id"] == "user123"
    assert payload["email"] == "test@test.com"
    assert payload["role"] == "STUDENT"


def test_verify_invalid_token(token_service: TokenService) -> None:
    payload = token_service.verify_access_token("invalid-token")
    assert payload is None


def test_verify_expired_token(token_service: TokenService) -> None:
    from datetime import datetime, timezone
    import jwt

    now = datetime.now(timezone.utc)
    payload = {
        "user_id": "user123",
        "email": "test@test.com",
        "role": "STUDENT",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=-10)).timestamp()),
        "type": "access",
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    result = token_service.verify_access_token(token)
    assert result is None


def test_no_fallback_secret() -> None:
    """Si JWT_SECRET es vacio, debe fallar al startup."""
    with pytest.raises(Exception):
        from app.config import Settings
        Settings(
            DATABASE_URL="postgresql://x:x@localhost/x",
            JWT_SECRET="",
            JWT_REFRESH_SECRET="valid-r3fresh-k3y-that-is-exactly-64-characters-long-xxxx",
            EXECUTOR_SECRET="test-executor-secret-value-for-testing",
        )


async def test_blacklist_token(token_service: TokenService) -> None:
    await token_service.blacklist_token("some-token", expires_in=900)
    token_service.redis.setex.assert_called_once_with(f"{BLACKLIST_PREFIX}some-token", 900, "1")


async def test_is_blacklisted_true(token_service: TokenService) -> None:
    token_service.redis.get = AsyncMock(return_value="1")
    result = await token_service.is_blacklisted("some-token")
    assert result is True


async def test_is_blacklisted_false(token_service: TokenService) -> None:
    token_service.redis.get = AsyncMock(return_value=None)
    result = await token_service.is_blacklisted("some-token")
    assert result is False


async def test_invalidate_all_user_tokens(token_service: TokenService) -> None:
    await token_service.invalidate_all_user_tokens("user123")
    token_service.redis.setex.assert_called_once()
    call_args = token_service.redis.setex.call_args
    assert f"{INVALIDATE_PREFIX}user123" in str(call_args)


async def test_are_tokens_invalidated_after_issue(token_service: TokenService) -> None:
    token_service.redis.get = AsyncMock(return_value="9999999999")
    result = await token_service.are_user_tokens_invalidated("user123", iat=1000000000)
    assert result is True


async def test_are_tokens_not_invalidated(token_service: TokenService) -> None:
    token_service.redis.get = AsyncMock(return_value=None)
    result = await token_service.are_user_tokens_invalidated("user123", iat=1000000000)
    assert result is False
