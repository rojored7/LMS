import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.gamification import Badge, UserBadge
from app.models.user import User

logger = structlog.get_logger()


class BadgeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, badge_id: str) -> Badge:
        result = await self.db.execute(select(Badge).where(Badge.id == badge_id))
        badge = result.scalar_one_or_none()
        if not badge:
            raise NotFoundError("Badge no encontrado")
        return badge

    async def list_badges(self) -> list[Badge]:
        result = await self.db.execute(select(Badge).order_by(Badge.created_at.desc()))
        return list(result.scalars().all())

    async def create(self, data: dict) -> Badge:
        badge = Badge(**data)
        self.db.add(badge)
        await self.db.flush()
        logger.info("badge_created", badge_id=badge.id, name=badge.name)
        return badge

    async def update(self, badge_id: str, data: dict) -> Badge:
        badge = await self.get_by_id(badge_id)
        for key, value in data.items():
            if value is not None and hasattr(badge, key):
                setattr(badge, key, value)
        await self.db.flush()
        return badge

    async def delete(self, badge_id: str) -> None:
        badge = await self.get_by_id(badge_id)
        await self.db.delete(badge)
        await self.db.flush()
        logger.info("badge_deleted", badge_id=badge_id)

    async def award_badge(self, user_id: str, badge_id: str) -> UserBadge:
        result = await self.db.execute(
            select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ConflictError("El usuario ya tiene este badge")

        badge = await self.get_by_id(badge_id)
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        self.db.add(user_badge)

        if badge.xp_reward > 0:
            user_result = await self.db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if user:
                user.xp = user.xp + badge.xp_reward

        await self.db.flush()
        logger.info("badge_awarded", user_id=user_id, badge_id=badge_id)
        return user_badge

    async def get_user_badges(self, user_id: str) -> list[UserBadge]:
        result = await self.db.execute(
            select(UserBadge)
            .where(UserBadge.user_id == user_id)
            .options(selectinload(UserBadge.badge))
            .order_by(UserBadge.earned_at.desc())
        )
        return list(result.scalars().all())
