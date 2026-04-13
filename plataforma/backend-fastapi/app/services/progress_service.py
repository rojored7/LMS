from datetime import datetime, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import NotFoundError
from app.models.course import Course, Lesson, Module
from app.models.progress import Enrollment, UserProgress

logger = structlog.get_logger()


class ProgressService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_progress(self, user_id: str, module_id: str) -> UserProgress:
        result = await self.db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        )
        progress = result.scalar_one_or_none()
        if not progress:
            lesson_count_result = await self.db.execute(
                select(func.count()).select_from(Lesson).where(Lesson.module_id == module_id)
            )
            total_lessons = lesson_count_result.scalar() or 0
            progress = UserProgress(user_id=user_id, module_id=module_id, total_lessons=total_lessons)
            self.db.add(progress)
            await self.db.flush()
        return progress

    async def mark_lesson_complete(self, user_id: str, module_id: str, lesson_id: str) -> UserProgress:
        progress = await self.get_or_create_progress(user_id, module_id)
        if progress.completed_lessons < progress.total_lessons:
            progress.completed_lessons = progress.completed_lessons + 1
        if progress.completed_lessons >= progress.total_lessons and progress.total_lessons > 0:
            progress.completed_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self._recalculate_enrollment_progress(user_id, module_id)
        return progress

    async def update_quiz_score(self, user_id: str, module_id: str, score: float, attempt: int) -> UserProgress:
        progress = await self.get_or_create_progress(user_id, module_id)
        progress.quiz_score = score
        progress.quiz_attempts = attempt
        await self.db.flush()
        return progress

    async def mark_lab_complete(self, user_id: str, module_id: str) -> UserProgress:
        progress = await self.get_or_create_progress(user_id, module_id)
        progress.lab_completed = True
        await self.db.flush()
        await self._recalculate_enrollment_progress(user_id, module_id)
        return progress

    async def update_project_status(self, user_id: str, module_id: str, status: str) -> UserProgress:
        progress = await self.get_or_create_progress(user_id, module_id)
        progress.project_status = status
        await self.db.flush()
        return progress

    async def get_course_progress(self, user_id: str, course_id: str) -> dict:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        enrollment = result.scalar_one_or_none()
        if not enrollment:
            raise NotFoundError("Inscripcion no encontrada")

        module_result = await self.db.execute(
            select(Module).where(Module.course_id == course_id).order_by(Module.order)
        )
        modules = list(module_result.scalars().all())

        progress_result = await self.db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.module_id.in_([m.id for m in modules]),
            )
        )
        progress_list = list(progress_result.scalars().all())
        progress_map = {p.module_id: p for p in progress_list}

        module_progress = []
        for mod in modules:
            p = progress_map.get(mod.id)
            module_progress.append({
                "moduleId": mod.id,
                "moduleTitle": mod.title,
                "moduleOrder": mod.order,
                "completedLessons": p.completed_lessons if p else 0,
                "totalLessons": p.total_lessons if p else 0,
                "quizScore": p.quiz_score if p else None,
                "quizAttempts": p.quiz_attempts if p else 0,
                "labCompleted": p.lab_completed if p else False,
                "projectStatus": p.project_status if p else None,
                "completedAt": p.completed_at.isoformat() if p and p.completed_at else None,
            })

        return {
            "courseId": course_id,
            "overallProgress": enrollment.progress,
            "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            "enrolledAt": enrollment.created_at.isoformat(),
            "modules": module_progress,
        }

    async def get_detailed_progress(self, user_id: str) -> list[dict]:
        enroll_result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id).options(
                selectinload(Enrollment.course).selectinload(Course.modules)
            )
        )
        enrollments = list(enroll_result.scalars().all())

        if not enrollments:
            return []

        all_module_ids = []
        for enrollment in enrollments:
            if enrollment.course and enrollment.course.modules:
                all_module_ids.extend([m.id for m in enrollment.course.modules])

        progress_map: dict[str, UserProgress] = {}
        if all_module_ids:
            progress_result = await self.db.execute(
                select(UserProgress).where(
                    UserProgress.user_id == user_id,
                    UserProgress.module_id.in_(all_module_ids),
                )
            )
            for p in progress_result.scalars().all():
                progress_map[p.module_id] = p

        detailed = []
        for enrollment in enrollments:
            course = enrollment.course
            modules_detail = []
            if course and course.modules:
                for mod in course.modules:
                    p = progress_map.get(mod.id)
                    modules_detail.append({
                        "moduleId": mod.id,
                        "moduleTitle": mod.title,
                        "completedLessons": p.completed_lessons if p else 0,
                        "totalLessons": p.total_lessons if p else 0,
                        "quizScore": p.quiz_score if p else None,
                        "labCompleted": p.lab_completed if p else False,
                        "projectStatus": p.project_status if p else None,
                    })

            detailed.append({
                "courseId": course.id if course else enrollment.course_id,
                "courseTitle": course.title if course else "",
                "overallProgress": enrollment.progress,
                "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
                "enrolledAt": enrollment.created_at.isoformat(),
                "modules": modules_detail,
            })

        return detailed

    async def _recalculate_enrollment_progress(self, user_id: str, module_id: str) -> None:
        module_result = await self.db.execute(select(Module).where(Module.id == module_id))
        module = module_result.scalar_one_or_none()
        if not module:
            return

        course_id = module.course_id
        all_modules_result = await self.db.execute(
            select(Module).where(Module.course_id == course_id)
        )
        all_modules = list(all_modules_result.scalars().all())
        if not all_modules:
            return

        progress_result = await self.db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.module_id.in_([m.id for m in all_modules]),
            )
        )
        progress_list = list(progress_result.scalars().all())

        total_lessons = sum(p.total_lessons for p in progress_list)
        completed_lessons = sum(p.completed_lessons for p in progress_list)

        if total_lessons > 0:
            overall = round((completed_lessons / total_lessons) * 100, 2)
        else:
            overall = 0.0

        enroll_result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        enrollment = enroll_result.scalar_one_or_none()
        if enrollment:
            enrollment.progress = overall
            if overall >= 100.0 and not enrollment.completed_at:
                enrollment.completed_at = datetime.now(timezone.utc)
            await self.db.flush()
