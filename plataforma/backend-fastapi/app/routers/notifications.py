from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.user import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    unreadOnly: bool = False,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    notifications = await service.get_notifications(user.id, unread_only=unreadOnly, limit=limit, offset=offset)
    return {"success": True, "data": [NotificationResponse.model_validate(n).model_dump() for n in notifications]}


@router.get("/unread-count")
async def get_unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    count = await service.get_unread_count(user.id)
    return {"success": True, "data": {"count": count}}


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    await service.mark_as_read(notification_id, user.id)
    return {"success": True, "data": {"message": "Notificacion marcada como leida"}}


@router.post("/read-all")
async def mark_all_as_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    await service.mark_all_as_read(user.id)
    return {"success": True, "data": {"message": "Todas las notificaciones marcadas como leidas"}}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    await service.delete_notification(notification_id, user.id)
    return {"success": True, "data": {"message": "Notificacion eliminada"}}
