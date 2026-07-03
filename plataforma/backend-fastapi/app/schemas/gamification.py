from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.common import CamelModel


class XpAdjustRequest(CamelModel):
    amount: int = Field(ge=-10000, le=10000)
    reason: str = Field(max_length=500)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v == 0:
            raise ValueError("El monto no puede ser 0")
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La razon es requerida")
        return v


class XpTransactionResponse(CamelModel):
    id: str
    user_id: str
    amount: int
    reason: str
    source: str
    admin_id: str | None = None
    reference_id: str | None = None
    created_at: datetime


class LeaderboardEntry(CamelModel):
    id: str
    name: str
    email: str
    avatar: str | None = None
    xp: int = 0
    role: str
    rank: int = 0


class BadgeUpdateRequest(CamelModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    xp_reward: int | None = None
    category: str | None = None
    requirement: str | None = None
    icon_url: str | None = None
