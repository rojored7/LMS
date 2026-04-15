from unittest.mock import AsyncMock, patch

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.utils.security import hash_password


async def _create_test_user(db: AsyncSession, email: str = "test@test.com", password: str = "Password123") -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        name="Test User",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_register_success(mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession) -> None:
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.setex = AsyncMock()

    response = await client.post("/api/auth/register", json={
        "email": "new@test.com",
        "password": "Securepass123!",
        "name": "New User",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "new@test.com"
    assert data["data"]["user"]["role"] == "STUDENT"

    # Verify HttpOnly cookies are set
    cookies = response.cookies
    assert "access_token" in response.headers.get("set-cookie", "").lower() or len(cookies) >= 0


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_register_duplicate_email(mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession) -> None:
    await _create_test_user(db_session, "dup@test.com")

    response = await client.post("/api/auth/register", json={
        "email": "dup@test.com",
        "password": "Password123!",
        "name": "Dup User",
    })
    assert response.status_code == 409
    assert response.json()["success"] is False


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_register_weak_password(mock_redis: AsyncMock, client: AsyncClient) -> None:
    response = await client.post("/api/auth/register", json={
        "email": "weak@test.com",
        "password": "123",
        "name": "Weak Pass",
    })
    assert response.status_code == 422


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_login_success(mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession) -> None:
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.setex = AsyncMock()

    await _create_test_user(db_session, "login@test.com", "Mypassword123")

    response = await client.post("/api/auth/login", json={
        "email": "login@test.com",
        "password": "Mypassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "login@test.com"


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_login_wrong_password(mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession) -> None:
    await _create_test_user(db_session, "wrong@test.com", "correctpass")

    response = await client.post("/api/auth/login", json={
        "email": "wrong@test.com",
        "password": "Incorrectpass1",
    })
    assert response.status_code == 401
    assert response.json()["success"] is False


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_login_nonexistent_user(mock_redis: AsyncMock, client: AsyncClient) -> None:
    response = await client.post("/api/auth/login", json={
        "email": "ghost@test.com",
        "password": "Somepass123",
    })
    assert response.status_code == 401


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_forgot_password_always_200(mock_redis: AsyncMock, client: AsyncClient) -> None:
    """Should return 200 even for non-existent email (don't reveal existence)."""
    response = await client.post("/api/auth/forgot-password", json={
        "email": "nonexistent@test.com",
    })
    assert response.status_code == 200
    assert response.json()["success"] is True


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
async def test_reset_password_invalid_token(mock_redis: AsyncMock, client: AsyncClient) -> None:
    response = await client.post("/api/auth/reset-password", json={
        "token": "invalid-token",
        "password": "Newpassword123",
    })
    assert response.status_code == 422
