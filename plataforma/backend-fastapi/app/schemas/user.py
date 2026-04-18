import re
from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, Field, field_validator

from app.schemas.common import CamelModel


ALLOWED_AVATAR_DOMAINS = {"localhost", "127.0.0.1", "res.cloudinary.com", "i.imgur.com", "avatars.githubusercontent.com"}


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    avatar: AnyHttpUrl | None = None

    @field_validator("avatar")
    @classmethod
    def validate_avatar_domain(cls, v: AnyHttpUrl | None) -> AnyHttpUrl | None:
        if v is None:
            return v
        host = str(v).split("//")[-1].split("/")[0].split(":")[0]
        if host not in ALLOWED_AVATAR_DOMAINS:
            raise ValueError(f"Dominio de avatar no permitido: {host}")
        return v

    theme: Literal["light", "dark", "system"] | None = None
    locale: str | None = Field(default=None, pattern=r'^[a-z]{2}(-[A-Z]{2})?$', max_length=10)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        from app.utils.validators import validate_password_strength
        return validate_password_strength(v)


class BadgeCreate(BaseModel):
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None
    xp_reward: int = 0


class TrainingProfileCreate(BaseModel):
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None


class TrainingProfileUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str | list[str]]

    @field_validator("answers")
    @classmethod
    def validate_answers_size(cls, v: dict) -> dict:
        if len(v) > 200:
            raise ValueError("Maximo 200 respuestas")
        return v


ALLOWED_LANGUAGES = {"python", "javascript", "bash"}


class LabSubmitRequest(BaseModel):
    code: str
    language: str

    @field_validator("code")
    @classmethod
    def validate_code_length(cls, v: str) -> str:
        if len(v) > 50000:
            raise ValueError("Codigo excede 50KB")
        if len(v) < 1:
            raise ValueError("Codigo no puede estar vacio")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(f"Lenguaje no soportado: {v}. Permitidos: {ALLOWED_LANGUAGES}")
        return v


class UserResponse(CamelModel):
    id: str
    email: str
    name: str
    role: str
    avatar: str | None = None
    xp: int = 0
    theme: str = "system"
    locale: str = "es"
    created_at: datetime
    last_login_at: datetime | None = None


class BadgeResponse(CamelModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str | None = None
    icon_url: str | None = None
    color: str | None = None
    xp_reward: int = 0
    course_id: str | None = None
    level: str | None = None
    duration_hours: int | None = None
    source: str = "platform"
    is_external: bool = False
    category: str | None = None
    requirement: str | None = None


class UserBadgeResponse(CamelModel):
    id: str
    user_id: str
    badge_id: str
    earned_at: datetime
    enrolled_at: datetime | None = None
    completed_at: datetime | None = None
    course_id: str | None = None
    badge: BadgeResponse | None = None


class ExternalBadgeImport(CamelModel):
    name: str = Field(min_length=1, max_length=255)
    source: str = Field(min_length=1, max_length=100)
    level: Literal["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    duration_hours: int | None = Field(default=None, ge=0, le=10000)
    description: str | None = Field(default=None, max_length=1000)


class NotificationResponse(CamelModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    read: bool
    data: dict | None = None
    created_at: datetime


class CertificateResponse(CamelModel):
    id: str
    user_id: str
    course_id: str
    issued_at: datetime
    certificate_url: str
    verification_code: str
    email_sent: bool


class TrainingProfileResponse(CamelModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None
