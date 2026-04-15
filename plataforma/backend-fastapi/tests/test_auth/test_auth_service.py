"""Tests for AuthService: register, login, logout, forgot_password, reset_password, change_password."""
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.models.user import PasswordResetToken, RefreshToken, User, UserRole
from app.services.auth_service import AuthService
from app.utils.security import hash_password


def _make_token_service() -> MagicMock:
    ts = MagicMock()
    ts.create_access_token = MagicMock(return_value="access-tok")
    ts.create_refresh_token = MagicMock(return_value="refresh-tok")
    ts.blacklist_token = AsyncMock()
    ts.invalidate_all_user_tokens = AsyncMock()
    ts.verify_refresh_token = MagicMock(return_value=None)
    return ts


@pytest.mark.asyncio
async def test_register_success(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    result = await svc.register("nuevo@test.com", "Password123!", "Nuevo Usuario")
    user = result["user"]
    tokens = result["tokens"]

    assert user.email == "nuevo@test.com"
    assert user.name == "Nuevo Usuario"
    assert user.role == UserRole.STUDENT
    assert tokens["access_token"] == "access-tok"
    assert tokens["refresh_token"] == "refresh-tok"
    assert tokens["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    existing = User(email="dup@test.com", password_hash=hash_password("x"), name="Dup", role=UserRole.STUDENT)
    db_session.add(existing)
    await db_session.flush()

    with pytest.raises(ConflictError, match="email ya esta registrado"):
        await svc.register("dup@test.com", "Password123!", "Otro")


@pytest.mark.asyncio
async def test_login_success(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    pw = "SecurePass99!"
    user = User(email="login@test.com", password_hash=hash_password(pw), name="Login User", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    result = await svc.login("login@test.com", pw)
    assert result["user"].email == "login@test.com"
    assert result["tokens"]["access_token"] == "access-tok"
    assert result["user"].last_login_at is not None


@pytest.mark.asyncio
async def test_login_wrong_password(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="bad@test.com", password_hash=hash_password("Correct1!"), name="Bad", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    with pytest.raises(AuthenticationError, match="Credenciales invalidas"):
        await svc.login("bad@test.com", "WrongPass!")


@pytest.mark.asyncio
async def test_login_unknown_email(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    with pytest.raises(AuthenticationError, match="Credenciales invalidas"):
        await svc.login("noexiste@test.com", "Whatever1!")


@pytest.mark.asyncio
async def test_logout(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="logout@test.com", password_hash=hash_password("x"), name="L", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    rt = RefreshToken(
        user_id=user.id,
        token="old-refresh",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(rt)
    await db_session.flush()

    await svc.logout("my-access-token", user.id)

    ts.blacklist_token.assert_awaited_once_with("my-access-token")


@pytest.mark.asyncio
async def test_forgot_password_existing_user(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="forgot@test.com", password_hash=hash_password("x"), name="F", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    with patch("app.services.email_service.send_password_reset_email", new_callable=AsyncMock) as mock_email:
        result = await svc.forgot_password("forgot@test.com")

    assert "enlace de restablecimiento" in result["message"]
    mock_email.assert_awaited_once()


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    result = await svc.forgot_password("ghost@test.com")
    assert "enlace de restablecimiento" in result["message"]


@pytest.mark.asyncio
async def test_reset_password_success(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="reset@test.com", password_hash=hash_password("OldPass1!"), name="R", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    prt = PasswordResetToken(
        user_id=user.id,
        token="valid-reset-token",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(prt)
    await db_session.flush()

    await svc.reset_password("valid-reset-token", "NewPass99!")
    ts.invalidate_all_user_tokens.assert_awaited_once_with(user.id)


@pytest.mark.asyncio
async def test_reset_password_invalid_token(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    with pytest.raises(ValidationError, match="Token de restablecimiento invalido"):
        await svc.reset_password("no-existe", "NewPass!")


@pytest.mark.asyncio
async def test_reset_password_expired_token(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="exp@test.com", password_hash=hash_password("x"), name="E", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    prt = PasswordResetToken(
        user_id=user.id,
        token="expired-token",
        expires_at=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    db_session.add(prt)
    await db_session.flush()

    with pytest.raises(ValidationError, match="Token de restablecimiento expirado"):
        await svc.reset_password("expired-token", "NewPass!")


@pytest.mark.asyncio
async def test_change_password_success(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    current_pw = "Current99!"
    user = User(email="chg@test.com", password_hash=hash_password(current_pw), name="C", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    await svc.change_password(user, current_pw, "NewSecure88!")
    ts.invalidate_all_user_tokens.assert_awaited_once_with(user.id)


@pytest.mark.asyncio
async def test_change_password_wrong_current(db_session: AsyncSession) -> None:
    ts = _make_token_service()
    svc = AuthService(db_session, ts)

    user = User(email="chgbad@test.com", password_hash=hash_password("Real1!"), name="CB", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    with pytest.raises(ValidationError, match="Contrasena actual incorrecta"):
        await svc.change_password(user, "WrongCurrent!", "NewPass!")
