from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator

from pydantic_settings import BaseSettings, SettingsConfigDict


KNOWN_WEAK_SECRETS = frozenset({
    "changeme",
    "secret",
    "password",
    "your-super-secret-jwt-key-change-in-production",
    "test-secret-key-minimum-32-characters-long",
})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_ENV: Literal["development", "production", "test"] = "development"
    PORT: int = 4000
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost"]

    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_TIMEOUT: int = 30
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL: int = 3600

    JWT_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_EXPIRES_IN_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_IN_DAYS: int = 7
    JWT_MAX_SESSION_HOURS: int = 24
    JWT_INACTIVITY_MINUTES: int = 60
    MAX_SESSIONS_PER_USER: int = 5

    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_GLOBAL: str = "200/15minutes"
    RATE_LIMIT_AUTH_LOGIN: str = "10/15minutes"
    RATE_LIMIT_AUTH_REGISTER: str = "5/hour"
    RATE_LIMIT_AUTH_RESET: str = "3/hour"
    RATE_LIMIT_AUTH_CHANGE_PASSWORD: str = "5/hour"
    RATE_LIMIT_CERTIFICATE_GENERATE: str = "10/hour"
    RATE_LIMIT_CERTIFICATE_GET: str = "30/minute"

    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_UPLOAD_EXTENSIONS: str = ".pdf,.png,.jpg,.jpeg"
    ALLOWED_UPLOAD_MIMES: str = "application/pdf,image/png,image/jpeg"

    MAX_PAGE_SIZE: int = 100

    EXECUTOR_SERVICE_URL: str = "http://localhost:5000"
    EXECUTOR_TIMEOUT: int = 30
    EXECUTOR_SECRET: str

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = ""

    CERTIFICATE_STORAGE_PATH: str = "./certificates"
    CERTIFICATE_BASE_URL: str = "http://localhost:4000/certificates"

    COOKIE_PREFIX: str = ""
    COOKIE_SAMESITE: str = "lax"

    CSP_STYLE_SRC: str = "'self' 'unsafe-inline'"
    CSP_SCRIPT_SRC: str = "'self'"

    GLITCHTIP_DSN: str = ""
    GLITCHTIP_INTERNAL_URL: str = "http://ciber-glitchtip:8000"
    GLITCHTIP_API_TOKEN: str = ""
    GLITCHTIP_WEBHOOK_SECRET: str = ""
    OTEL_TRACES_SAMPLE_RATE: float = 0.2
    INCIDENT_STORAGE_DIR: str = "./incidents"
    INCIDENT_NOTIFY_ADMINS: bool = True

    LOG_LEVEL: Literal["debug", "info", "warning", "error", "critical"] = "info"
    LOG_DIR: str = "./logs"

    @field_validator("JWT_SECRET", "JWT_REFRESH_SECRET")
    @classmethod
    def validate_jwt_secrets(cls, v: str, info: object) -> str:
        if len(v) < 32:
            raise ValueError("JWT secret debe tener al menos 32 caracteres")
        lower = v.lower()
        for weak in KNOWN_WEAK_SECRETS:
            if weak in lower:
                raise ValueError(f"JWT secret contiene un valor conocido como inseguro: '{weak}'")
        return v

    @field_validator("EXECUTOR_SECRET")
    @classmethod
    def validate_executor_secret(cls, v: str) -> str:
        if len(v) < 16:
            raise ValueError("EXECUTOR_SECRET debe tener al menos 16 caracteres")
        return v

    @field_validator("BCRYPT_ROUNDS")
    @classmethod
    def validate_bcrypt_rounds(cls, v: int) -> int:
        # 12-15: 12 para dev (~250ms), 15 para alta seguridad (~2s). >15 causa DoS por lentitud.
        if not 12 <= v <= 15:
            raise ValueError("BCRYPT_ROUNDS debe estar entre 12 y 15")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        for weak in KNOWN_WEAK_SECRETS:
            if weak in v.lower():
                import structlog
                structlog.get_logger().warning("database_weak_password", message="DATABASE_URL contiene un valor debil.")
        return v

    @model_validator(mode="after")
    def validate_production_constraints(self):
        if self.APP_ENV == "production":
            for weak in KNOWN_WEAK_SECRETS:
                if weak in self.DATABASE_URL.lower():
                    raise ValueError("DATABASE_URL contiene password debil - no permitido en produccion")
        return self

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_test(self) -> bool:
        return self.APP_ENV == "test"


@lru_cache
def get_settings() -> Settings:
    return Settings()
