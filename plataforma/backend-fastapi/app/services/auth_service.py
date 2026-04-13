import secrets
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.middleware.error_handler import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.models.user import PasswordResetToken, RefreshToken, User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password, verify_password

logger = structlog.get_logger()
settings = get_settings()


class AuthService:
    def __init__(self, db: AsyncSession, token_service: TokenService):
        self.db = db
        self.token_service = token_service

    async def register(self, email: str, password: str, name: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        if existing:
            raise ConflictError("El email ya esta registrado")

        hashed = hash_password(password)
        user = User(email=email, password_hash=hashed, name=name, role=UserRole.STUDENT)
        self.db.add(user)
        await self.db.flush()

        tokens = await self._generate_tokens(user)
        logger.info("user_registered", user_id=user.id, email=email)
        return {"user": user, "tokens": tokens}

    async def login(self, email: str, password: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise AuthenticationError("Credenciales invalidas")

        user.last_login_at = datetime.now(timezone.utc)
        tokens = await self._generate_tokens(user)
        logger.info("user_logged_in", user_id=user.id)
        return {"user": user, "tokens": tokens}

    async def refresh_tokens(self, refresh_token_value: str) -> dict:
        payload = self.token_service.verify_refresh_token(refresh_token_value)
        if not payload:
            raise AuthenticationError("Refresh token invalido o expirado")

        user_id = payload.get("user_id")
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token_value, RefreshToken.user_id == user_id)
        )
        stored = result.scalar_one_or_none()
        if not stored:
            raise AuthenticationError("Refresh token no encontrado")

        if stored.expires_at < datetime.now(timezone.utc):
            await self.db.delete(stored)
            await self.db.flush()
            raise AuthenticationError("Refresh token expirado")

        await self.db.delete(stored)

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise AuthenticationError("Usuario no encontrado")

        tokens = await self._generate_tokens(user)
        return {"user": user, "tokens": tokens}

    async def logout(self, access_token: str, user_id: str) -> None:
        await self.token_service.blacklist_token(access_token)
        await self.db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
        await self.db.flush()
        logger.info("user_logged_out", user_id=user_id)

    async def forgot_password(self, email: str) -> dict:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return {"message": "Si el email existe, se enviara un enlace de restablecimiento"}

        token_value = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        reset_token = PasswordResetToken(user_id=user.id, token=token_value, expires_at=expires_at)
        self.db.add(reset_token)
        await self.db.flush()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token_value}"
        logger.info("password_reset_requested", user_id=user.id, reset_url=reset_url)
        return {"message": "Si el email existe, se enviara un enlace de restablecimiento", "reset_url": reset_url}

    async def reset_password(self, token_value: str, new_password: str) -> None:
        result = await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.token == token_value, PasswordResetToken.used_at.is_(None))
        )
        reset_token = result.scalar_one_or_none()
        if not reset_token:
            raise ValidationError("Token de restablecimiento invalido")

        if reset_token.expires_at < datetime.now(timezone.utc):
            raise ValidationError("Token de restablecimiento expirado")

        result = await self.db.execute(select(User).where(User.id == reset_token.user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("Usuario no encontrado")

        user.password_hash = hash_password(new_password)
        reset_token.used_at = datetime.now(timezone.utc)
        await self.token_service.invalidate_all_user_tokens(user.id)
        await self.db.flush()
        logger.info("password_reset_completed", user_id=user.id)

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise ValidationError("Contrasena actual incorrecta")
        user.password_hash = hash_password(new_password)
        await self.token_service.invalidate_all_user_tokens(user.id)
        await self.db.flush()
        logger.info("password_changed", user_id=user.id)

    async def _generate_tokens(self, user: User) -> dict:
        access_token = self.token_service.create_access_token(user.id, user.email, user.role.value)
        refresh_token_value = self.token_service.create_refresh_token(user.id)
        await self._store_refresh_token(user.id, refresh_token_value)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRES_IN_MINUTES * 60,
        }

    async def _store_refresh_token(self, user_id: str, token_value: str) -> None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRES_IN_DAYS)
        rt = RefreshToken(user_id=user_id, token=token_value, expires_at=expires_at)
        self.db.add(rt)
        await self.db.flush()
