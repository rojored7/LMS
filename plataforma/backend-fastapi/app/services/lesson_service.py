import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.course import Lesson, Module

logger = structlog.get_logger()


class LessonService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, lesson_id: str) -> Lesson:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()
        if not lesson:
            raise NotFoundError("Leccion no encontrada")
        return lesson

    async def list_by_module(self, module_id: str) -> list[Lesson]:
        result = await self.db.execute(
            select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order)
        )
        return list(result.scalars().all())

    async def create(self, module_id: str, data: dict) -> Lesson:
        result = await self.db.execute(select(Module).where(Module.id == module_id))
        module = result.scalar_one_or_none()
        if not module:
            raise NotFoundError("Modulo no encontrado")

        lesson = Lesson(module_id=module_id, **data)
        self.db.add(lesson)
        await self.db.flush()
        logger.info("lesson_created", lesson_id=lesson.id, module_id=module_id)
        return lesson

    async def update(self, lesson_id: str, data: dict) -> Lesson:
        lesson = await self.get_by_id(lesson_id)
        for key, value in data.items():
            if value is not None and hasattr(lesson, key):
                setattr(lesson, key, value)
        await self.db.flush()
        return lesson

    async def delete(self, lesson_id: str) -> None:
        lesson = await self.get_by_id(lesson_id)
        await self.db.delete(lesson)
        await self.db.flush()
        logger.info("lesson_deleted", lesson_id=lesson_id)
