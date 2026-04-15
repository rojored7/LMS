from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

BLACKLIST_PREFIX = "bl:"
INVALIDATE_PREFIX = "inv:"


class TokenService:
    def __init__(self, redis):
        self.redis = redis

    def create_access_token(self, user_id: str, email: str, role: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "user_id": user_id,
            "email": email,
            "role": role,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=settings.JWT_EXPIRES_IN_MINUTES)).timestamp()),
            "type": "access",
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    def create_refresh_token(self, user_id: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "user_id": user_id,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=settings.JWT_REFRESH_EXPIRES_IN_DAYS)).timestamp()),
            "type": "refresh",
        }
        return jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm="HS256")

    def verify_access_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            if payload.get("type") != "access":
                return None
            return payload
        except ExpiredSignatureError:
            logger.debug("token_expired")
            return None
        except InvalidTokenError:
            logger.debug("token_invalid")
            return None

    def verify_refresh_token(self, token: str) -> dict | None:
        try:
            payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
            if payload.get("type") != "refresh":
                return None
            return payload
        except ExpiredSignatureError:
            logger.debug("refresh_token_expired")
            return None
        except InvalidTokenError:
            logger.debug("refresh_token_invalid")
            return None

    async def blacklist_token(self, token: str, expires_in: int | None = None) -> None:
        ttl = expires_in or settings.JWT_EXPIRES_IN_MINUTES * 60
        await self.redis.setex(f"{BLACKLIST_PREFIX}{token}", ttl, "1")

    async def is_blacklisted(self, token: str) -> bool:
        try:
            result = await self.redis.get(f"{BLACKLIST_PREFIX}{token}")
            return result is not None
        except Exception:
            logger.warning("redis_unavailable_blacklist_check", token_prefix=token[:8])
            return False

    async def invalidate_all_user_tokens(self, user_id: str) -> None:
        now = int(datetime.now(timezone.utc).timestamp())
        ttl = settings.JWT_REFRESH_EXPIRES_IN_DAYS * 86400
        await self.redis.setex(f"{INVALIDATE_PREFIX}{user_id}", ttl, str(now))

    async def are_user_tokens_invalidated(self, user_id: str, iat: int) -> bool:
        try:
            invalidated_at = await self.redis.get(f"{INVALIDATE_PREFIX}{user_id}")
            if invalidated_at is None:
                return False
            return iat < int(invalidated_at)
        except Exception:
            logger.warning("redis_unavailable_invalidation_check", user_id=user_id)
            return False
