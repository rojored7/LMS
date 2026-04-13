import structlog
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.gamification import Notification, NotificationType

logger = structlog.get_logger()


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, notification_id: str) -> Notification:
        result = await self.db.execute(select(Notification).where(Notification.id == notification_id))
        notif = result.scalar_one_or_none()
        if not notif:
            raise NotFoundError("Notificacion no encontrada")
        return notif

    async def list_user_notifications(
        self, user_id: str, page: int = 1, limit: int = 20, unread_only: bool = False
    ) -> dict:
        query = select(Notification).where(Notification.user_id == user_id)
        count_query = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.read.is_(False))
            count_query = count_query.where(Notification.read.is_(False))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * limit
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        notifications = list(result.scalars().all())

        unread_result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id, Notification.read.is_(False)
            )
        )
        unread_count = unread_result.scalar() or 0

        return {
            "notifications": notifications,
            "total": total,
            "unreadCount": unread_count,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if total else 0,
        }

    async def create(self, user_id: str, title: str, message: str, type_: str = "SYSTEM", link: str | None = None) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=NotificationType(type_),
            link=link,
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def mark_as_read(self, notification_id: str, user_id: str) -> Notification:
        notif = await self.get_by_id(notification_id)
        if notif.user_id != user_id:
            raise NotFoundError("Notificacion no encontrada")
        notif.read = True
        await self.db.flush()
        return notif

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read.is_(False))
            .values(read=True)
        )
        await self.db.flush()
        return result.rowcount

    async def delete(self, notification_id: str, user_id: str) -> None:
        notif = await self.get_by_id(notification_id)
        if notif.user_id != user_id:
            raise NotFoundError("Notificacion no encontrada")
        await self.db.delete(notif)
        await self.db.flush()
