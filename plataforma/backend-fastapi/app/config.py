from functools import lru_cache
from typing import Literal

from pydantic import field_validator
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

    NODE_ENV: Literal["development", "production", "test"] = "development"
    PORT: int = 4000
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL: int = 3600

    JWT_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_EXPIRES_IN_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_IN_DAYS: int = 7

    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_GLOBAL: str = "200/15minutes"
    RATE_LIMIT_AUTH_LOGIN: str = "10/15minutes"
    RATE_LIMIT_AUTH_REGISTER: str = "5/hour"
    RATE_LIMIT_AUTH_RESET: str = "3/hour"

    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    UPLOAD_DIR: str = "./uploads"

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

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.NODE_ENV == "development"

    @property
    def is_test(self) -> bool:
        return self.NODE_ENV == "test"


@lru_cache
def get_settings() -> Settings:
    return Settings()
