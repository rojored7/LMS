import redis.asyncio as aioredis
from app.config import get_settings

settings = get_settings()
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def check_redis_connection() -> bool:
    try:
        await redis_client.ping()
        return True
    except Exception:
        return False


async def close_redis() -> None:
    await redis_client.aclose()
