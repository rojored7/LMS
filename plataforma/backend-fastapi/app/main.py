import os
import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings
from app.database import check_database_connection
from app.middleware.correlation import CorrelationIdMiddleware
from app.middleware.error_handler import register_exception_handlers
from app.middleware.rate_limit import limiter
from app.redis import check_redis_connection, close_redis
from app.utils.logger import setup_logging

settings = get_settings()
logger = structlog.get_logger()

# Initialize GlitchTip/Sentry error tracking (if configured)
if settings.GLITCHTIP_DSN:
    import logging as _logging
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    sentry_sdk.init(
        dsn=settings.GLITCHTIP_DSN,
        environment=settings.APP_ENV,
        traces_sample_rate=settings.OTEL_TRACES_SAMPLE_RATE if settings.is_production else 1.0,
        send_default_pii=False,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
            LoggingIntegration(level=_logging.WARNING, event_level=_logging.ERROR),
        ],
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()

    if not settings.is_production:
        logger.warning(
            "insecure_cookie_warning",
            message="Cookies no se envian como Secure. Solo para desarrollo.",
        )

    db_ok = await check_database_connection()
    if db_ok:
        logger.info("database_connected")
    else:
        logger.error("database_connection_failed")

    redis_ok = await check_redis_connection()
    if redis_ok:
        logger.info("redis_connected")
    else:
        logger.warning("redis_connection_failed")

    logger.info("server_starting", port=settings.PORT, env=settings.APP_ENV)
    yield

    from app.services.executor_client import ExecutorClient
    await ExecutorClient.close()
    await close_redis()
    logger.info("server_stopped")


app = FastAPI(
    title="Plataforma Ciberseguridad API",
    description="API para la plataforma de aprendizaje de ciberseguridad",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/api-docs",
    redoc_url=None if settings.is_production else "/api-redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

register_exception_handlers(app)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        connect_src = "'self'" if settings.is_production else "'self' ws: wss:"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            f"script-src {settings.CSP_SCRIPT_SRC}; "
            f"style-src {settings.CSP_STYLE_SRC}; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            f"connect-src {connect_src}; "
            "frame-ancestors 'none'"
        )
        return response


app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Request-ID"],
)

from app.routers import (
    admin,
    analytics,
    auth,
    badges,
    certificates,
    course_management,
    courses,
    instructor,
    labs,
    lessons,
    modules,
    notifications,
    progress,
    projects,
    quizzes,
    training_profiles,
    users,
)

# Static files for uploads (certificates, etc.)
_uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
try:
    os.makedirs(os.path.join(_uploads_dir, "certificates"), exist_ok=True)
except OSError:
    pass  # Volume may already exist with different ownership
if os.path.isdir(_uploads_dir):
    app.mount("/api/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(modules.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(labs.router)
app.include_router(projects.router)
app.include_router(progress.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
app.include_router(badges.router)
app.include_router(admin.router)
app.include_router(training_profiles.router)
app.include_router(analytics.router)
app.include_router(course_management.router)
app.include_router(instructor.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ciber-backend-fastapi"}


@app.get("/health/ready")
async def health_ready():
    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()
    status = "ready" if db_ok and redis_ok else "degraded"
    if settings.is_production:
        return {"status": status}
    return {
        "status": status,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
    }


@app.get("/health/live")
async def health_live():
    return {"status": "alive"}


if not settings.is_production:
    from fastapi import Depends as _Dep
    from app.middleware.auth import get_current_user as _get_user

    @app.get("/api/debug/error")
    async def debug_trigger_error(user=_Dep(_get_user)):
        """Endpoint de prueba que genera un error 500 real (solo dev). Requiere auth."""
        raise RuntimeError(f"Test error for user {user.email}")
