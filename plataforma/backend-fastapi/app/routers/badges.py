from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.common import ApiResponse, CamelModel
from app.services.badge_service import BadgeService

router = APIRouter(prefix="/api/badges", tags=["badges"])


class BadgeCreate(BaseModel):
    name: str
    description: str | None = None
    icon: str | None = None
    criteria: str | None = None
    xp_reward: int = 0


class BadgeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    criteria: str | None = None
    xp_reward: int | None = None


class AwardBadgeRequest(BaseModel):
    user_id: str
    badge_id: str


class BadgeResponse(CamelModel):
    id: str
    name: str
    description: str | None = None
    icon: str | None = None
    criteria: str | None = None
    xp_reward: int
    created_at: datetime


class UserBadgeResponse(CamelModel):
    id: str
    user_id: str
    badge_id: str
    earned_at: datetime
    badge: BadgeResponse | None = None


@router.get("")
async def list_badges(db: AsyncSession = Depends(get_db)):
    service = BadgeService(db)
    badges = await service.list_badges()
    data = [BadgeResponse.model_validate(b).model_dump() for b in badges]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{badge_id}")
async def get_badge(badge_id: str, db: AsyncSession = Depends(get_db)):
    service = BadgeService(db)
    badge = await service.get_by_id(badge_id)
    return ApiResponse(success=True, data=BadgeResponse.model_validate(badge).model_dump()).model_dump()


@router.post("")
async def create_badge(
    body: BadgeCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    badge = await service.create(body.model_dump())
    return ApiResponse(success=True, data=BadgeResponse.model_validate(badge).model_dump()).model_dump()


@router.put("/{badge_id}")
async def update_badge(
    badge_id: str,
    body: BadgeUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    badge = await service.update(badge_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=BadgeResponse.model_validate(badge).model_dump()).model_dump()


@router.delete("/{badge_id}")
async def delete_badge(
    badge_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    await service.delete(badge_id)
    return ApiResponse(success=True, data={"message": "Badge eliminado"}).model_dump()


@router.post("/award")
async def award_badge(
    body: AwardBadgeRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    user_badge = await service.award_badge(body.user_id, body.badge_id)
    return ApiResponse(success=True, data=UserBadgeResponse.model_validate(user_badge).model_dump()).model_dump()


@router.get("/user/{user_id}")
async def get_user_badges(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    user_badges = await service.get_user_badges(user_id)
    data = [UserBadgeResponse.model_validate(ub).model_dump() for ub in user_badges]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/me/badges")
async def get_my_badges(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BadgeService(db)
    user_badges = await service.get_user_badges(user.id)
    data = [UserBadgeResponse.model_validate(ub).model_dump() for ub in user_badges]
    return ApiResponse(success=True, data=data).model_dump()
