from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.gamification import Notification, NotificationType


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_notifications(self, user_id: str, unread_only: bool = False, limit: int = 20, offset: int = 0) -> list[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.read == False)  # noqa: E712
        query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: str) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id, Notification.read == False  # noqa: E712
            )
        )
        return result.scalar() or 0

    async def mark_as_read(self, notification_id: str, user_id: str) -> None:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        )
        notif = result.scalar_one_or_none()
        if notif is None:
            raise NotFoundError("Notificacion no encontrada")
        notif.read = True
        await self.db.flush()

    async def mark_all_as_read(self, user_id: str) -> None:
        await self.db.execute(
            update(Notification).where(
                Notification.user_id == user_id, Notification.read == False  # noqa: E712
            ).values(read=True)
        )
        await self.db.flush()

    async def delete_notification(self, notification_id: str, user_id: str) -> None:
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        )
        notif = result.scalar_one_or_none()
        if notif is None:
            raise NotFoundError("Notificacion no encontrada")
        await self.db.delete(notif)
        await self.db.flush()

    async def create_notification(self, user_id: str, type: NotificationType, title: str, message: str, data: dict | None = None) -> Notification:
        notif = Notification(user_id=user_id, type=type, title=title, message=message, data=data)
        self.db.add(notif)
        await self.db.flush()
        return notif
