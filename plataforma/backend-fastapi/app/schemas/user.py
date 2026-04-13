from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import CamelModel


class UserResponse(CamelModel):
    id: str
    email: str
    name: str
    role: str
    avatar: str | None = None
    xp: int = 0
    theme: str = "system"
    locale: str = "es"
    training_profile_id: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class UserUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    avatar: str | None = None
    theme: str | None = None
    locale: str | None = None
    training_profile_id: str | None = None


class AdminUserUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    avatar: str | None = None
    training_profile_id: str | None = None
