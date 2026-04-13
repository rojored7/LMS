from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse, CamelModel, PaginationMeta
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationResponse(CamelModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    link: str | None = None
    created_at: datetime


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    result = await service.list_user_notifications(user.id, page=page, limit=limit, unread_only=unread_only)
    notifications = [NotificationResponse.model_validate(n).model_dump() for n in result["notifications"]]
    return ApiResponse(
        success=True,
        data={"notifications": notifications, "unreadCount": result["unreadCount"]},
        meta=PaginationMeta(total=result["total"], page=result["page"], limit=result["limit"], pages=result["pages"]),
    ).model_dump()


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    notif = await service.mark_as_read(notification_id, user.id)
    return ApiResponse(success=True, data=NotificationResponse.model_validate(notif).model_dump()).model_dump()


@router.put("/read-all")
async def mark_all_as_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.mark_all_as_read(user.id)
    return ApiResponse(success=True, data={"markedRead": count}).model_dump()


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    await service.delete(notification_id, user.id)
    return ApiResponse(success=True, data={"message": "Notificacion eliminada"}).model_dump()
