import re
import unicodedata
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.gamification import Badge, Notification, NotificationType, UserBadge
from app.models.user import User
from app.utils.course_scoring import calculate_course_score

logger = structlog.get_logger()


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text)[:100]


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
        result = await self.db.execute(
            select(UserBadge)
            .options(selectinload(UserBadge.badge))
            .where(UserBadge.user_id == user_id)
            .order_by(UserBadge.earned_at.desc())
        )
        return list(result.scalars().all())

    async def award_course_completion_badge(
        self, user_id: str, course: object, enrollment: object
    ) -> UserBadge | None:
        course_id = course.id  # type: ignore[attr-defined]
        course_slug = course.slug  # type: ignore[attr-defined]
        course_title = course.title  # type: ignore[attr-defined]
        course_level = getattr(course.level, "value", str(course.level))  # type: ignore[attr-defined]
        course_duration = course.duration  # type: ignore[attr-defined]

        slug = f"course-{course_slug}"

        # Find or create the badge for this course
        result = await self.db.execute(
            select(Badge).where(Badge.course_id == course_id)
        )
        badge = result.scalar_one_or_none()

        if badge is None:
            badge = Badge(
                name=f"Completado: {course_title}",
                slug=slug,
                description=f"Curso {course_title} completado exitosamente",
                course_id=course_id,
                level=course_level,
                duration_hours=round(course_duration / 60),
                category="course_completion",
                requirement=f"Completa el curso {course_title}",
                source="platform",
                xp_reward=0,
            )
            self.db.add(badge)
            await self.db.flush()
            await self.db.refresh(badge)

        # Check idempotency
        existing = await self.db.execute(
            select(UserBadge).where(
                UserBadge.user_id == user_id,
                UserBadge.badge_id == badge.id,
            )
        )
        if existing.scalar_one_or_none():
            return None

        ub = UserBadge(
            user_id=user_id,
            badge_id=badge.id,
            enrolled_at=getattr(enrollment, "enrolled_at", None),
            completed_at=getattr(enrollment, "completed_at", None),
            course_id=course_id,
        )
        self.db.add(ub)

        # Create notification
        notification = Notification(
            user_id=user_id,
            title="Badge obtenido",
            message=f"Obtuviste el badge: {badge.name}",
            type=NotificationType.BADGE_AWARDED,
            data={"badgeId": badge.id, "badgeName": badge.name},
        )
        self.db.add(notification)
        await self.db.flush()
        return ub

    async def import_external_badge(
        self,
        user_id: str,
        name: str,
        source: str,
        level: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        duration_hours: int | None = None,
        description: str | None = None,
    ) -> UserBadge:
        slug = f"ext-{_slugify(name)}-{_slugify(source)}"

        # Find or create badge
        result = await self.db.execute(
            select(Badge).where(Badge.slug == slug)
        )
        badge = result.scalar_one_or_none()

        if badge is None:
            # Calculate XP from level + duration using same formula as courses
            xp_score = 0
            duration_min = (duration_hours or 0) * 60
            if level and duration_hours:
                xp_score = calculate_course_score(level, duration_min)
            elif level:
                xp_score = calculate_course_score(level, 0)
            elif duration_hours:
                xp_score = calculate_course_score("BEGINNER", duration_min)

            badge = Badge(
                name=name,
                slug=slug,
                description=description or f"Certificacion externa: {name} ({source})",
                level=level,
                duration_hours=duration_hours,
                source=source,
                is_external=True,
                category="external",
                requirement=f"Certificacion en {source}",
                xp_reward=xp_score,
            )
            self.db.add(badge)
            await self.db.flush()
            await self.db.refresh(badge)

        # Check idempotency
        existing = await self.db.execute(
            select(UserBadge).where(
                UserBadge.user_id == user_id,
                UserBadge.badge_id == badge.id,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Ya tienes este badge importado")

        ub = UserBadge(
            user_id=user_id,
            badge_id=badge.id,
            enrolled_at=start_date,
            completed_at=end_date,
        )
        self.db.add(ub)

        # Award XP to user
        if badge.xp_reward and badge.xp_reward > 0:
            user = await self.db.get(User, user_id)
            if user:
                user.xp = (user.xp or 0) + badge.xp_reward

        await self.db.flush()

        # Eager load badge for response
        await self.db.refresh(ub)
        result = await self.db.execute(
            select(UserBadge)
            .options(selectinload(UserBadge.badge))
            .where(UserBadge.id == ub.id)
        )
        return result.scalar_one()
