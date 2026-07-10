import structlog
from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user, get_token_service
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LdapLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService
from app.services.token_service import TokenService

logger = structlog.get_logger()

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.get("/providers")
async def get_auth_providers():
    providers = {"local": True, "ldap": settings.LDAP_ENABLED}
    if settings.OAUTH_ENABLED and settings.GOOGLE_CLIENT_ID:
        providers["google"] = True
    else:
        providers["google"] = False
    return ApiResponse(success=True, data={"providers": providers}).model_dump()


def _set_cookies(response: Response, tokens: dict) -> None:
    secure = settings.is_production and settings.FRONTEND_URL.startswith("https")
    prefix = settings.COOKIE_PREFIX
    samesite = settings.COOKIE_SAMESITE
    response.set_cookie(
        key=f"{prefix}access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=tokens["expires_in"],
        path="/api",
    )
    response.set_cookie(
        key=f"{prefix}refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=settings.JWT_REFRESH_EXPIRES_IN_DAYS * 86400,
        path="/api/auth/refresh",
    )


def _clear_cookies(response: Response) -> None:
    prefix = settings.COOKIE_PREFIX
    response.delete_cookie(f"{prefix}access_token", path="/api")
    response.delete_cookie(f"{prefix}refresh_token", path="/api/auth/refresh")


@router.post("/register")
@limiter.limit(settings.RATE_LIMIT_AUTH_REGISTER)
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    result = await service.register(body.email, body.password, body.name)
    user = result["user"]
    tokens = result["tokens"]
    _set_cookies(response, tokens)
    return ApiResponse(
        success=True,
        data={
            "user": AuthUserResponse.model_validate(user).model_dump(),
        },
    ).model_dump()


@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_AUTH_LOGIN)
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    result = await service.login(body.email, body.password)
    user = result["user"]
    tokens = result["tokens"]
    _set_cookies(response, tokens)
    return ApiResponse(
        success=True,
        data={
            "user": AuthUserResponse.model_validate(user).model_dump(),
        },
    ).model_dump()


@router.post("/refresh")
@limiter.limit("30/minute")
async def refresh_tokens(
    request: Request,
    response: Response,
    body: RefreshRequest | None = None,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    refresh_token_value = None
    if body and body.refresh_token:
        refresh_token_value = body.refresh_token
    else:
        refresh_token_value = request.cookies.get(f"{settings.COOKIE_PREFIX}refresh_token")

    if not refresh_token_value:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Refresh token requerido")

    service = AuthService(db, token_service)
    result = await service.refresh_tokens(refresh_token_value)
    tokens = result["tokens"]
    _set_cookies(response, tokens)
    return ApiResponse(
        success=True,
        data={
            "user": AuthUserResponse.model_validate(result["user"]).model_dump(),
        },
    ).model_dump()


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else request.cookies.get(f"{settings.COOKIE_PREFIX}access_token", "")
    service = AuthService(db, token_service)
    await service.logout(access_token, user.id)
    _clear_cookies(response)
    return ApiResponse(success=True, data={"message": "Sesion cerrada exitosamente"}).model_dump()


@router.post("/forgot-password")
@limiter.limit(settings.RATE_LIMIT_AUTH_RESET)
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    result = await service.forgot_password(body.email)
    return ApiResponse(success=True, data=result).model_dump()


@router.post("/reset-password")
@limiter.limit(settings.RATE_LIMIT_AUTH_RESET)
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    await service.reset_password(body.token, body.password)
    return ApiResponse(success=True, data={"message": "Contrasena restablecida exitosamente"}).model_dump()


@router.post("/change-password")
@limiter.limit(settings.RATE_LIMIT_AUTH_CHANGE_PASSWORD)
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    auth_header = request.headers.get("Authorization", "")
    current_token = auth_header.removeprefix("Bearer ").strip() or None

    service = AuthService(db, token_service)
    await service.change_password(user, body.current_password, body.new_password, current_access_token=current_token)
    return ApiResponse(success=True, data={"message": "Contrasena cambiada exitosamente"}).model_dump()


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=AuthUserResponse.model_validate(user).model_dump()).model_dump()


@router.get("/sessions")
async def get_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    sessions = await service.get_active_sessions(user.id)
    return ApiResponse(success=True, data={"sessions": sessions}).model_dump()


@router.delete("/sessions/{session_id}")
async def close_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    await service.close_session(user.id, session_id)
    return ApiResponse(success=True, data={"message": "Sesion cerrada"}).model_dump()


@router.delete("/sessions")
async def close_all_other_sessions(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    current_refresh = request.cookies.get(f"{settings.COOKIE_PREFIX}refresh_token", "")
    service = AuthService(db, token_service)
    count = await service.close_all_other_sessions(user.id, current_refresh)
    return ApiResponse(success=True, data={"message": f"{count} sesiones cerradas"}).model_dump()


# ---------------------------------------------------------------------------
# OAuth 2.0
# ---------------------------------------------------------------------------


@router.get("/oauth/authorize/{provider}")
async def oauth_authorize(provider: str, request: Request):
    if not settings.OAUTH_ENABLED:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="OAuth no habilitado")

    if provider != "google":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Proveedor OAuth no soportado: {provider}")

    from app.services.oauth_service import OAuthService, generate_oauth_state

    state = generate_oauth_state()

    # Guardar state en Redis para validacion anti-CSRF
    redis = request.app.state.redis
    if redis:
        await redis.set(f"oauth:state:{state}", provider, ex=600)

    service = OAuthService(None, None)
    url = service.get_google_authorization_url(state)
    return RedirectResponse(url=url, status_code=302)


@router.get("/oauth/callback/{provider}")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str = Query(default=None),
    state: str = Query(default=None),
    error: str = Query(default=None),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    frontend_url = settings.FRONTEND_URL

    if error:
        logger.warning("oauth_callback_error", provider=provider, error=error)
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_denied",
            status_code=302,
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_invalid",
            status_code=302,
        )

    # Validar state anti-CSRF
    redis = request.app.state.redis
    if redis:
        stored_provider = await redis.get(f"oauth:state:{state}")
        if not stored_provider:
            return RedirectResponse(
                url=f"{frontend_url}/login?error=oauth_state_invalid",
                status_code=302,
            )
        await redis.delete(f"oauth:state:{state}")
        if stored_provider.decode() if isinstance(stored_provider, bytes) else stored_provider != provider:
            return RedirectResponse(
                url=f"{frontend_url}/login?error=oauth_state_mismatch",
                status_code=302,
            )

    if provider != "google":
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_provider_unsupported",
            status_code=302,
        )

    from app.services.oauth_service import OAuthService

    oauth_service = OAuthService(db, token_service)

    try:
        token_data = await oauth_service.exchange_google_code(code)
        user_info = await oauth_service.get_google_user_info(token_data["access_token"])
        result = await oauth_service.login_or_create_user("google", user_info)
        await db.commit()
    except Exception as e:
        logger.error("oauth_callback_failed", provider=provider, error=str(e))
        return RedirectResponse(
            url=f"{frontend_url}/login?error=oauth_failed",
            status_code=302,
        )

    redirect = RedirectResponse(
        url=f"{frontend_url}/auth/oauth/callback?success=true",
        status_code=302,
    )
    _set_cookies(redirect, result["tokens"])
    return redirect


# ---------------------------------------------------------------------------
# LDAP
# ---------------------------------------------------------------------------


@router.post("/login/ldap")
@limiter.limit(settings.RATE_LIMIT_AUTH_LOGIN)
async def login_ldap(
    request: Request,
    body: LdapLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    if not settings.LDAP_ENABLED:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="LDAP no habilitado")

    from app.services.ldap_service import LdapService

    ldap_service = LdapService()
    auth_service = AuthService(db, token_service)
    result = await ldap_service.authenticate_and_sync(
        body.username, body.password, db, token_service
    )
    user = result["user"]
    tokens = result["tokens"]
    _set_cookies(response, tokens)
    return ApiResponse(
        success=True,
        data={"user": AuthUserResponse.model_validate(user).model_dump()},
    ).model_dump()
