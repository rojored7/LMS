from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.gamification import Badge, UserBadge


class BadgeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all_badges(self) -> list[Badge]:
        result = await self.db.execute(select(Badge))
        return list(result.scalars().all())

    async def create_badge(self, name: str, slug: str, description: str, icon: str | None, color: str | None, xp_reward: int) -> Badge:
        badge = Badge(name=name, slug=slug, description=description, icon=icon, color=color, xp_reward=xp_reward)
        self.db.add(badge)
        await self.db.flush()
        await self.db.refresh(badge)
        return badge

    async def award_badge(self, user_id: str, badge_id: str) -> UserBadge:
        existing = await self.db.execute(select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id))
        if existing.scalar_one_or_none():
            raise ConflictError("Usuario ya tiene este badge")
        ub = UserBadge(user_id=user_id, badge_id=badge_id)
        self.db.add(ub)
        await self.db.flush()
        await self.db.refresh(ub)
        return ub

    async def get_user_badges(self, user_id: str) -> list[UserBadge]:
        result = await self.db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
        return list(result.scalars().all())
