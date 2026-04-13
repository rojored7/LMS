import structlog
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings
from app.database import check_database_connection
from app.middleware.error_handler import register_exception_handlers
from app.middleware.rate_limit import limiter
from app.redis import check_redis_connection, close_redis
from app.utils.logger import setup_logging

settings = get_settings()
logger = structlog.get_logger()


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

    logger.info("server_starting", port=settings.PORT, env=settings.NODE_ENV)
    yield

    await close_redis()
    logger.info("server_stopped")


app = FastAPI(
    title="Plataforma Ciberseguridad API",
    description="API para la plataforma de aprendizaje de ciberseguridad",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api-docs",
    redoc_url="/api-redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

from app.routers import (
    admin,
    analytics,
    auth,
    badges,
    certificates,
    course_management,
    courses,
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


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ciber-backend-fastapi"}


@app.get("/health/ready")
async def health_ready():
    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()
    status = "ready" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
    }


@app.get("/health/live")
async def health_live():
    return {"status": "alive"}
