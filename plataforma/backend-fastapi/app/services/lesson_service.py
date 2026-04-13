from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.assessment import Lab, Quiz
from app.models.course import Lesson
from app.models.progress import UserProgress


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
