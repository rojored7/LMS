from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import BadgeCreate, BadgeResponse, ExternalBadgeImport, UserBadgeResponse
from app.services.badge_service import BadgeService

router = APIRouter(prefix="/api/badges", tags=["badges"])


@router.get("")
async def list_badges(db: AsyncSession = Depends(get_db)) -> dict:
    service = BadgeService(db)
    badges = await service.get_all_badges()
    return {"success": True, "data": [BadgeResponse.model_validate(b).model_dump() for b in badges]}


@router.post("")
async def create_badge(data: BadgeCreate, _user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    service = BadgeService(db)
    badge = await service.create_badge(data.name, data.slug, data.description, data.icon, data.color, data.xp_reward)
    return {"success": True, "data": BadgeResponse.model_validate(badge).model_dump()}


@router.post("/{badge_id}/award/{user_id}")
async def award_badge(badge_id: str, user_id: str, _user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    service = BadgeService(db)
    user_badge = await service.award_badge(user_id, badge_id)
    return {"success": True, "data": UserBadgeResponse.model_validate(user_badge).model_dump()}


@router.get("/user/{user_id}")
async def get_user_badges(user_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    from app.middleware.error_handler import AuthorizationError
    from app.models.user import UserRole
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise AuthorizationError("No autorizado para ver badges de otro usuario")
    service = BadgeService(db)
    badges = await service.get_user_badges(user_id)
    return {"success": True, "data": [UserBadgeResponse.model_validate(b).model_dump() for b in badges]}


@router.post("/import-external")
async def import_external_badge(
    data: ExternalBadgeImport,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = BadgeService(db)
    user_badge = await service.import_external_badge(
        user_id=current_user.id,
        name=data.name,
        source=data.source,
        level=data.level,
        start_date=data.start_date,
        end_date=data.end_date,
        duration_hours=data.duration_hours,
        description=data.description,
    )
    return {"success": True, "data": UserBadgeResponse.model_validate(user_badge).model_dump()}


@router.get("/{badge_id}")
async def get_badge(badge_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    from sqlalchemy import select
    from app.models.gamification import Badge
    from app.middleware.error_handler import NotFoundError
    result = await db.execute(select(Badge).where(Badge.id == badge_id))
    badge = result.scalar_one_or_none()
    if badge is None:
        raise NotFoundError("Badge no encontrado")
    return {"success": True, "data": BadgeResponse.model_validate(badge).model_dump()}
