from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.config import get_settings
from app.database import get_db
from app.middleware.error_handler import AuthenticationError, AuthorizationError
from app.models.user import User, UserRole
from app.redis import redis_client
from app.services.token_service import TokenService

logger = structlog.get_logger()
settings = get_settings()


def get_token_service() -> TokenService:
    return TokenService(redis=redis_client)


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    token = request.cookies.get(f"{settings.COOKIE_PREFIX}access_token")
    if token:
        return token
    return None


async def _validate_token(token: str, token_service: TokenService, db: AsyncSession) -> User:
    if await token_service.is_blacklisted(token):
        raise AuthenticationError("Token revocado")
    payload = token_service.verify_access_token(token)
    if payload is None:
        raise AuthenticationError("Token invalido o expirado")
    user_id = payload.get("user_id")
    email = payload.get("email")
    role = payload.get("role")
    if not all([user_id, email, role]):
        raise AuthenticationError("Token con datos incompletos")
    iat = payload.get("iat")
    if iat and await token_service.are_user_tokens_invalidated(user_id, int(iat)):
        raise AuthenticationError("Sesion invalidada. Inicie sesion nuevamente")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthenticationError("Usuario no encontrado")
    return user


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db), token_service: TokenService = Depends(get_token_service)) -> User:
    token = _extract_token(request)
    if not token:
        raise AuthenticationError("Token de autenticacion requerido")
    return await _validate_token(token, token_service, db)


async def get_optional_user(request: Request, db: AsyncSession = Depends(get_db), token_service: TokenService = Depends(get_token_service)) -> User | None:
    token = _extract_token(request)
    if not token:
        return None
    try:
        return await _validate_token(token, token_service, db)
    except AuthenticationError:
        return None


def require_role(allowed_roles: list[UserRole]):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise AuthorizationError("No tiene permisos para acceder a este recurso")
        return user
    return role_checker


require_admin = require_role([UserRole.ADMIN])
require_instructor = require_role([UserRole.ADMIN, UserRole.INSTRUCTOR])


async def verify_module_ownership(module_id: str, user: User, db: AsyncSession) -> None:
    """Verifica que el instructor es dueno del curso al que pertenece el modulo."""
    if user.role == UserRole.ADMIN:
        return
    from app.models.course import Course, Module
    result = await db.execute(
        select(Course.author_id)
        .join(Module, Module.course_id == Course.id)
        .where(Module.id == module_id)
    )
    author_id = result.scalar_one_or_none()
    if author_id != user.id:
        raise AuthorizationError("No tiene permisos sobre este curso")
