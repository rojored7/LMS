from starlette.requests import Request
from slowapi import Limiter
from app.config import get_settings

settings = get_settings()


def get_real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=get_real_ip, storage_uri=settings.REDIS_URL, default_limits=[settings.RATE_LIMIT_GLOBAL])
