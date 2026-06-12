import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.assessment import Lab, Quiz
from app.models.course import Lesson, Module
from app.models.progress import UserProgress

logger = structlog.get_logger()


class LessonService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_lesson(self, lesson_id: str) -> Lesson:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()
        if lesson is None:
            raise NotFoundError("Leccion no encontrada")
        return lesson

    async def get_lesson_progress(self, lesson_id: str, user_id: str) -> dict:
        lesson = await self.get_lesson(lesson_id)
        result = await self.db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id == lesson.module_id, UserProgress.lesson_id == lesson_id)
        )
        progress = result.scalar_one_or_none()
        return {"lessonId": lesson_id, "completed": progress.completed if progress else False, "progress": progress.progress if progress else 0, "timeSpent": progress.time_spent if progress else 0}

    async def get_lesson_quiz(self, lesson_id: str) -> Quiz | None:
        lesson = await self.get_lesson(lesson_id)
        result = await self.db.execute(select(Quiz).where(Quiz.module_id == lesson.module_id).limit(1))
        return result.scalars().first()

    async def get_lesson_lab(self, lesson_id: str) -> Lab | None:
        lesson = await self.get_lesson(lesson_id)
        result = await self.db.execute(select(Lab).where(Lab.module_id == lesson.module_id).limit(1))
        return result.scalars().first()

    async def create(self, module_id: str, data: dict) -> Lesson:
        result = await self.db.execute(select(Module).where(Module.id == module_id))
        module = result.scalar_one_or_none()
        if not module:
            raise NotFoundError("Modulo no encontrado")
        data = self._inject_video_provider(data)
        lesson = Lesson(module_id=module_id, **data)
        self.db.add(lesson)
        await self.db.flush()
        logger.info("lesson_created", lesson_id=lesson.id, module_id=module_id)
        return lesson

    async def update(self, lesson_id: str, data: dict) -> Lesson:
        lesson = await self.get_lesson(lesson_id)
        data = self._inject_video_provider(data)
        for key, value in data.items():
            if hasattr(lesson, key):
                setattr(lesson, key, value)
        await self.db.flush()
        return lesson

    @staticmethod
    def _inject_video_provider(data: dict) -> dict:
        url = data.get("video_url")
        if url is None:
            return data
        if "youtu" in url:
            provider = "youtube"
        elif "vimeo.com" in url:
            provider = "vimeo"
        elif "loom.com" in url:
            provider = "loom"
        elif "drive.google.com" in url:
            provider = "gdrive"
        else:
            provider = "other"
        return {**data, "video_provider": provider}

    async def delete(self, lesson_id: str) -> None:
        lesson = await self.get_lesson(lesson_id)
        await self.db.delete(lesson)
        await self.db.flush()
        logger.info("lesson_deleted", lesson_id=lesson_id)

    async def reorder(self, module_id: str, lesson_ids: list[str]) -> list[Lesson]:
        result = await self.db.execute(
            select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order)
        )
        lessons = list(result.scalars().all())
        lesson_map = {ls.id: ls for ls in lessons}
        for idx, lid in enumerate(lesson_ids):
            if lid in lesson_map:
                lesson_map[lid].order = idx
        await self.db.flush()
        result = await self.db.execute(
            select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order)
        )
        return list(result.scalars().all())
