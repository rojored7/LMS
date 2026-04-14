import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class ExecutorClient:
    def __init__(self):
        self.base_url = settings.EXECUTOR_SERVICE_URL
        self.timeout = settings.EXECUTOR_TIMEOUT
        self.secret = settings.EXECUTOR_SECRET

    async def execute_code(self, code: str, language: str = "python", test_code: str | None = None, timeout: int | None = None) -> dict:
        timeout_seconds = timeout or self.timeout
        payload = {
            "code": code,
            "language": language,
            "timeout": timeout_seconds * 1000,  # executor expects milliseconds
        }
        if test_code:
            payload["testCode"] = test_code

        try:
            async with httpx.AsyncClient(timeout=self.timeout + 10) as client:
                response = await client.post(
                    f"{self.base_url}/execute",
                    json=payload,
                    headers={"X-Executor-Secret": self.secret},
                )
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error("executor_timeout", language=language)
            return {"success": False, "error": "Tiempo de ejecucion agotado", "stdout": "", "stderr": "Timeout"}
        except httpx.HTTPStatusError as e:
            logger.error("executor_http_error", status=e.response.status_code)
            return {"success": False, "error": f"Error del ejecutor: {e.response.status_code}", "stdout": "", "stderr": str(e)}
        except Exception as e:
            logger.error("executor_error", error=str(e))
            return {"success": False, "error": "Error de conexion con el ejecutor", "stdout": "", "stderr": str(e)}

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False
