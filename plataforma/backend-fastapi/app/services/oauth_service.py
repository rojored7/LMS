import secrets
from datetime import datetime, timezone

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.middleware.error_handler import AuthenticationError, ValidationError
from app.models.user import User, UserRole
from app.services.token_service import TokenService

logger = structlog.get_logger()
settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GOOGLE_SCOPES = "openid email profile"


class OAuthService:
    def __init__(self, db: AsyncSession, token_service: TokenService):
        self.db = db
        self.token_service = token_service

    def get_google_authorization_url(self, state: str) -> str:
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationError("OAuth de Google no configurado")

        redirect_uri = settings.GOOGLE_REDIRECT_URI
        if not redirect_uri:
            raise ValidationError("GOOGLE_REDIRECT_URI no configurado")

        from urllib.parse import urlencode

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": GOOGLE_SCOPES,
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    async def exchange_google_code(self, code: str) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            if resp.status_code != 200:
                logger.error("oauth_token_exchange_failed", status=resp.status_code, body=resp.text)
                raise AuthenticationError("Error al intercambiar codigo OAuth con Google")
            return resp.json()

    async def get_google_user_info(self, access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                logger.error("oauth_userinfo_failed", status=resp.status_code)
                raise AuthenticationError("Error al obtener informacion del usuario de Google")
            return resp.json()

    async def login_or_create_user(self, provider: str, user_info: dict) -> dict:
        email = user_info.get("email")
        if not email:
            raise AuthenticationError("El proveedor OAuth no retorno un email")

        external_id = user_info.get("sub", "")

        # Buscar usuario existente por provider + external_id
        result = await self.db.execute(
            select(User).where(User.auth_provider == provider, User.external_id == external_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            # Buscar por email (posible cuenta local existente)
            result = await self.db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                # Vincular cuenta existente con OAuth si es local y no tiene external_id
                if user.auth_provider == "local":
                    user.auth_provider = provider
                    user.external_id = external_id
                    if user_info.get("picture") and not user.avatar:
                        user.avatar = user_info["picture"]
                    logger.info("oauth_account_linked", user_id=user.id, provider=provider)
                else:
                    raise AuthenticationError(
                        f"Este email ya esta registrado con {user.auth_provider}"
                    )
            else:
                # Crear nuevo usuario
                name = user_info.get("name", email.split("@")[0])
                user = User(
                    email=email,
                    password_hash=None,
                    name=name,
                    role=UserRole.STUDENT,
                    auth_provider=provider,
                    external_id=external_id,
                    avatar=user_info.get("picture"),
                )
                self.db.add(user)
                await self.db.flush()
                logger.info("oauth_user_created", user_id=user.id, provider=provider)

        user.last_login_at = datetime.now(timezone.utc)

        # Generar tokens JWT de la plataforma
        access_token = self.token_service.create_access_token(user.id, user.email, user.role.value)
        refresh_token_value = self.token_service.create_refresh_token(user.id)

        now = datetime.now(timezone.utc)
        from datetime import timedelta

        from app.models.user import RefreshToken

        # Limpiar sesiones excedentes
        result = await self.db.execute(
            select(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .order_by(RefreshToken.created_at.asc())
        )
        existing = list(result.scalars().all())
        if len(existing) >= settings.MAX_SESSIONS_PER_USER:
            for old in existing[: len(existing) - settings.MAX_SESSIONS_PER_USER + 1]:
                await self.db.delete(old)

        rt = RefreshToken(
            user_id=user.id,
            token=refresh_token_value,
            expires_at=now + timedelta(days=settings.JWT_REFRESH_EXPIRES_IN_DAYS),
            session_started_at=now,
            last_activity_at=now,
        )
        self.db.add(rt)
        await self.db.flush()

        tokens = {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRES_IN_MINUTES * 60,
        }

        logger.info("oauth_login_success", user_id=user.id, provider=provider)
        return {"user": user, "tokens": tokens}


def generate_oauth_state() -> str:
    return secrets.token_urlsafe(32)
