import asyncio
import time

import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

_MAX_RETRIES = 2
_RETRY_DELAY = 1.0
_HEALTH_CACHE_TTL = 30


class ExecutorClient:
    _client: httpx.AsyncClient | None = None
    _health_cache: bool | None = None
    _health_cache_ts: float = 0.0

    def __init__(self) -> None:
        self.base_url = settings.EXECUTOR_SERVICE_URL
        self.timeout = settings.EXECUTOR_TIMEOUT
        self.secret = settings.EXECUTOR_SECRET

    @classmethod
    def _get_client(cls, timeout: int) -> httpx.AsyncClient:
        if cls._client is None or cls._client.is_closed:
            cls._client = httpx.AsyncClient(timeout=timeout + 10)
        return cls._client

    @classmethod
    async def close(cls) -> None:
        if cls._client and not cls._client.is_closed:
            await cls._client.aclose()
            cls._client = None

    async def execute_code(
        self,
        code: str,
        language: str = "python",
        test_code: str | None = None,
        timeout: int | None = None,
    ) -> dict:
        timeout_seconds = timeout or self.timeout
        payload: dict = {
            "code": code,
            "language": language,
            "timeout": timeout_seconds * 1000,
        }
        if test_code:
            payload["testCode"] = test_code

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                client = self._get_client(timeout_seconds)
                response = await client.post(
                    f"{self.base_url}/execute",
                    json=payload,
                    headers={"X-Executor-Secret": self.secret},
                )
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException:
                logger.error("executor_timeout", language=language)
                return {
                    "success": False,
                    "error": "Tiempo de ejecucion agotado",
                    "stdout": "",
                    "stderr": "Timeout",
                }
            except httpx.HTTPStatusError as e:
                logger.error("executor_http_error", status=e.response.status_code, detail=str(e))
                return {
                    "success": False,
                    "executor_error": True,
                    "error": f"Error del ejecutor: {e.response.status_code}",
                    "stdout": "",
                    "stderr": "",
                }
            except (httpx.ConnectError, httpx.ConnectTimeout) as e:
                last_error = e
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "executor_connect_retry",
                        attempt=attempt + 1,
                        error=str(e),
                    )
                    await asyncio.sleep(_RETRY_DELAY * (attempt + 1))
                    continue
                break
            except Exception as e:
                last_error = e
                break

        logger.error("executor_error", error=str(last_error))
        return {
            "success": False,
            "executor_error": True,
            "error": "Error de conexion con el ejecutor",
            "stdout": "",
            "stderr": "",
        }

    async def health_check(self) -> bool:
        now = time.monotonic()
        if (
            self._health_cache is not None
            and now - self._health_cache_ts < _HEALTH_CACHE_TTL
        ):
            return self._health_cache

        try:
            client = self._get_client(5)
            response = await client.get(f"{self.base_url}/health")
            healthy = response.status_code == 200
        except Exception:
            healthy = False

        ExecutorClient._health_cache = healthy
        ExecutorClient._health_cache_ts = now
        return healthy


executor_client = ExecutorClient()
