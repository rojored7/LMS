from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class AppError(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(AppError):
    def __init__(self, message: str = "No autenticado"):
        super().__init__(message=message, code="UNAUTHORIZED", status_code=401)


class AuthorizationError(AppError):
    def __init__(self, message: str = "No autorizado"):
        super().__init__(message=message, code="FORBIDDEN", status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(message=message, code="NOT_FOUND", status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflicto"):
        super().__init__(message=message, code="CONFLICT", status_code=409)


class ValidationError(AppError):
    def __init__(self, message: str = "Datos invalidos"):
        super().__init__(message=message, code="VALIDATION_ERROR", status_code=422)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        logger.warning("app_error", code=exc.code, message=exc.message)
        # Report server errors (5xx) to GlitchTip/Sentry
        if exc.status_code >= 500:
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass
        return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "error": {"code": exc.code, "message": exc.message}})

    @app.exception_handler(Exception)
    async def general_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("unhandled_error", error=str(exc), type=type(exc).__name__)
        # Report ALL unhandled exceptions to GlitchTip/Sentry
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except Exception:
            pass
        return JSONResponse(status_code=500, content={"success": False, "data": None, "error": {"code": "INTERNAL_ERROR", "message": "Error interno del servidor"}})
