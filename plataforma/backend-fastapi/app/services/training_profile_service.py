import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.course import CourseProfile
from app.models.user import TrainingProfile

logger = structlog.get_logger()


class TrainingProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, profile_id: str) -> TrainingProfile:
        result = await self.db.execute(
            select(TrainingProfile)
            .where(TrainingProfile.id == profile_id)
            .options(selectinload(TrainingProfile.course_profiles))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("Perfil de formacion no encontrado")
        return profile

    async def get_by_slug(self, slug: str) -> TrainingProfile:
        result = await self.db.execute(
            select(TrainingProfile)
            .where(TrainingProfile.slug == slug)
            .options(selectinload(TrainingProfile.course_profiles))
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("Perfil de formacion no encontrado")
        return profile

    async def list_profiles(self) -> list[TrainingProfile]:
        result = await self.db.execute(
            select(TrainingProfile).options(selectinload(TrainingProfile.course_profiles))
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> TrainingProfile:
        existing = await self.db.execute(
            select(TrainingProfile).where(TrainingProfile.slug == data.get("slug"))
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Ya existe un perfil con ese slug")

        profile = TrainingProfile(**data)
        self.db.add(profile)
        await self.db.flush()
        logger.info("training_profile_created", profile_id=profile.id, name=profile.name)
        return profile

    async def update(self, profile_id: str, data: dict) -> TrainingProfile:
        profile = await self.get_by_id(profile_id)
        if "slug" in data and data["slug"] and data["slug"] != profile.slug:
            existing = await self.db.execute(
                select(TrainingProfile).where(TrainingProfile.slug == data["slug"], TrainingProfile.id != profile_id)
            )
            if existing.scalar_one_or_none():
                raise ConflictError("Ya existe un perfil con ese slug")

        for key, value in data.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)
        await self.db.flush()
        return profile

    async def delete(self, profile_id: str) -> None:
        profile = await self.get_by_id(profile_id)
        await self.db.delete(profile)
        await self.db.flush()
        logger.info("training_profile_deleted", profile_id=profile_id)

    async def add_course(self, profile_id: str, course_id: str, order: int = 0) -> CourseProfile:
        existing = await self.db.execute(
            select(CourseProfile).where(CourseProfile.profile_id == profile_id, CourseProfile.course_id == course_id)
        )
        if existing.scalar_one_or_none():
            raise ConflictError("El curso ya esta asignado a este perfil")

        cp = CourseProfile(profile_id=profile_id, course_id=course_id, order=order)
        self.db.add(cp)
        await self.db.flush()
        return cp

    async def remove_course(self, profile_id: str, course_id: str) -> None:
        result = await self.db.execute(
            select(CourseProfile).where(CourseProfile.profile_id == profile_id, CourseProfile.course_id == course_id)
        )
        cp = result.scalar_one_or_none()
        if not cp:
            raise NotFoundError("Relacion curso-perfil no encontrada")
        await self.db.delete(cp)
        await self.db.flush()
