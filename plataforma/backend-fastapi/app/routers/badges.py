import os

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.middleware.rate_limit import limiter
from app.models.gamification import UserBadge
from app.models.user import User
from app.schemas.user import BadgeCreate, BadgeResponse, ExternalBadgeImport, UserBadgeResponse
from app.services.badge_service import BadgeService

_ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

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
@limiter.limit("10/hour")
async def import_external_badge(
    request: Request,
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


@router.put("/user-badge/{user_badge_id}")
async def update_user_badge(
    user_badge_id: str,
    data: ExternalBadgeImport,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from sqlalchemy.orm import selectinload as _sl
    result = await db.execute(select(UserBadge).options(_sl(UserBadge.badge)).where(UserBadge.id == user_badge_id))
    ub = result.scalar_one_or_none()
    if ub is None:
        raise HTTPException(status_code=404, detail="UserBadge no encontrado")
    if ub.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    badge = ub.badge
    if badge and badge.is_external:
        badge.name = data.name
        badge.level = data.level
        badge.duration_hours = data.duration_hours
        badge.source = data.source
        badge.description = data.description or badge.description
    ub.enrolled_at = data.start_date
    ub.completed_at = data.end_date
    await db.flush()
    await db.commit()

    result = await db.execute(select(UserBadge).options(_sl(UserBadge.badge)).where(UserBadge.id == user_badge_id))
    ub = result.scalar_one()
    return {"success": True, "data": UserBadgeResponse.model_validate(ub).model_dump()}


@router.delete("/user-badge/{user_badge_id}")
async def delete_user_badge(
    user_badge_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(UserBadge).where(UserBadge.id == user_badge_id))
    ub = result.scalar_one_or_none()
    if ub is None:
        raise HTTPException(status_code=404, detail="UserBadge no encontrado")
    if ub.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Remove certificate file if exists
    if ub.certificate_url:
        filepath = os.path.join(os.environ.get("UPLOADS_DIR", "/app/uploads"), ub.certificate_url.replace("/api/uploads/", ""))
        if os.path.exists(filepath):
            os.remove(filepath)

    await db.delete(ub)
    await db.flush()
    await db.commit()
    return {"success": True, "data": {"message": "Badge eliminado"}}


@router.post("/user-badge/{user_badge_id}/certificate")
async def upload_certificate(
    user_badge_id: str,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(UserBadge).where(UserBadge.id == user_badge_id))
    ub = result.scalar_one_or_none()
    if ub is None:
        raise HTTPException(status_code=404, detail="UserBadge no encontrado")
    if ub.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extension no permitida. Permitidas: {_ALLOWED_EXTENSIONS}")

    content = await file.read()
    if len(content) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo excede 10MB")

    uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
    cert_dir = os.path.join(uploads_dir, "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    filename = f"{user_badge_id}{ext}"
    filepath = os.path.join(cert_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    ub.certificate_url = f"/api/uploads/certificates/{filename}"
    await db.flush()
    await db.commit()

    return {"success": True, "data": {"certificateUrl": ub.certificate_url}}


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
