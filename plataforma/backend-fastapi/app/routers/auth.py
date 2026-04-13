from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user, get_token_service
from app.middleware.rate_limit import limiter
from app.schemas.auth import (
    AuthUserResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService
from app.services.token_service import TokenService
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


def _set_cookies(response: Response, tokens: dict) -> None:
    secure = settings.is_production
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=tokens["expires_in"],
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=settings.JWT_REFRESH_EXPIRES_IN_DAYS * 86400,
        path="/api/auth/refresh",
    )


def _clear_cookies(response: Response) -> None:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/api/auth/refresh")


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
            "tokens": TokenResponse(**tokens).model_dump(),
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
            "tokens": TokenResponse(**tokens).model_dump(),
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
        refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        return ApiResponse(success=False, error={"code": "UNAUTHORIZED", "message": "Refresh token requerido"}).model_dump()

    service = AuthService(db, token_service)
    result = await service.refresh_tokens(refresh_token_value)
    tokens = result["tokens"]
    _set_cookies(response, tokens)
    return ApiResponse(
        success=True,
        data={
            "user": AuthUserResponse.model_validate(result["user"]).model_dump(),
            "tokens": TokenResponse(**tokens).model_dump(),
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
    access_token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else request.cookies.get("access_token", "")
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
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    token_service: TokenService = Depends(get_token_service),
):
    service = AuthService(db, token_service)
    await service.change_password(user, body.current_password, body.new_password)
    return ApiResponse(success=True, data={"message": "Contrasena cambiada exitosamente"}).model_dump()


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=AuthUserResponse.model_validate(user).model_dump()).model_dump()
