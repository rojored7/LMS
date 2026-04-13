from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.assessment import Lab, LabSubmission, Quiz, QuizAttempt
from app.models.course import Course, Lesson, Module
from app.models.progress import Enrollment, UserProgress

logger = structlog.get_logger()


class ProgressService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def mark_lesson_complete(self, user_id: str, lesson_id: str, time_spent: int = 0) -> UserProgress:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()
        if lesson is None:
            raise NotFoundError("Leccion no encontrada")
        existing = await self.db.execute(select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id == lesson.module_id, UserProgress.lesson_id == lesson_id))
        progress = existing.scalar_one_or_none()
        if progress is None:
            progress = UserProgress(user_id=user_id, module_id=lesson.module_id, lesson_id=lesson_id, status="completed", completed=True, progress=100, completed_at=datetime.now(timezone.utc), time_spent=time_spent, last_access=datetime.now(timezone.utc))
            self.db.add(progress)
        else:
            progress.status = "completed"
            progress.completed = True
            progress.progress = 100
            progress.completed_at = datetime.now(timezone.utc)
            progress.time_spent = (progress.time_spent or 0) + time_spent
            progress.last_access = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(progress)
        await self._recalculate_course_progress(user_id, lesson.module_id)
        return progress

    async def submit_quiz_attempt(self, user_id: str, quiz_id: str, answers: dict) -> QuizAttempt:
        result = await self.db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if quiz is None:
            raise NotFoundError("Quiz no encontrado")
        count_result = await self.db.execute(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id == quiz_id))
        if (count_result.scalar() or 0) >= quiz.attempts:
            raise ConflictError(f"Limite de intentos alcanzado ({quiz.attempts})")
        score = await self._calculate_score(quiz_id, answers)
        passed = score >= quiz.passing_score
        attempt = QuizAttempt(user_id=user_id, quiz_id=quiz_id, answers=answers, score=score, passed=passed, completed_at=datetime.now(timezone.utc))
        self.db.add(attempt)
        await self.db.flush()
        await self.db.refresh(attempt)
        if passed:
            await self._recalculate_course_progress(user_id, quiz.module_id)
        return attempt

    async def submit_lab(self, user_id: str, lab_id: str, code: str, language: str, passed: bool | None = None, stdout: str = "", stderr: str = "", exit_code: int = 0, execution_time: int = 0) -> LabSubmission:
        result = await self.db.execute(select(Lab).where(Lab.id == lab_id))
        lab = result.scalar_one_or_none()
        if lab is None:
            raise NotFoundError("Lab no encontrado")
        if passed is None:
            from app.services.executor_client import executor_client
            exec_result = await executor_client.execute_code(code=code, language=language, tests=lab.tests if isinstance(lab.tests, dict) else None)
            passed = exec_result["passed"]
            stdout = exec_result["stdout"]
            stderr = exec_result["stderr"]
            exit_code = exec_result["exitCode"]
            execution_time = exec_result["executionTime"]
        submission = LabSubmission(user_id=user_id, lab_id=lab_id, code=code, language=language, passed=passed, stdout=stdout, stderr=stderr, exit_code=exit_code, execution_time=execution_time)
        self.db.add(submission)
        await self.db.flush()
        await self.db.refresh(submission)
        if passed:
            await self._recalculate_course_progress(user_id, lab.module_id)
        return submission

    async def get_course_progress(self, user_id: str, course_id: str) -> int:
        result = await self.db.execute(select(Enrollment.progress).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
        return result.scalar_one_or_none() or 0

    async def get_detailed_course_progress(self, user_id: str, course_id: str) -> dict:
        modules_result = await self.db.execute(select(Module).where(Module.course_id == course_id).order_by(Module.order))
        modules = modules_result.scalars().all()
        module_ids = [m.id for m in modules]
        if not module_ids:
            return {"overallProgress": 0, "modules": []}
        totals_result = await self.db.execute(select(Lesson.module_id, func.count().label("cnt")).where(Lesson.module_id.in_(module_ids)).group_by(Lesson.module_id))
        totals_map = {row.module_id: row.cnt for row in totals_result}
        completed_result = await self.db.execute(select(UserProgress.module_id, func.count().label("cnt")).where(UserProgress.user_id == user_id, UserProgress.module_id.in_(module_ids), UserProgress.completed == True).group_by(UserProgress.module_id))  # noqa: E712
        completed_map = {row.module_id: row.cnt for row in completed_result}
        total_all = sum(totals_map.values())
        completed_all = sum(completed_map.values())
        overall = round((completed_all / total_all) * 100) if total_all > 0 else 0
        module_progress = []
        for mod in modules:
            total = totals_map.get(mod.id, 0)
            completed = completed_map.get(mod.id, 0)
            pct = round((completed / total) * 100) if total > 0 else 0
            module_progress.append({"moduleId": mod.id, "moduleTitle": mod.title, "progress": pct, "lessons": {"total": total, "completed": completed}})
        return {"overallProgress": overall, "modules": module_progress}

    async def get_lesson_progress(self, user_id: str, lesson_id: str) -> dict | None:
        result = await self.db.execute(select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id))
        progress = result.scalar_one_or_none()
        if progress is None:
            return None
        return {"completed": progress.completed, "completedAt": progress.completed_at.isoformat() if progress.completed_at else None, "timeSpent": progress.time_spent if hasattr(progress, "time_spent") else 0}

    async def _recalculate_course_progress(self, user_id: str, module_id: str) -> None:
        module_result = await self.db.execute(select(Module).where(Module.id == module_id))
        module = module_result.scalar_one_or_none()
        if module is None:
            return
        course_id = module.course_id
        modules_result = await self.db.execute(select(Module.id).where(Module.course_id == course_id))
        module_ids = [m for m in modules_result.scalars().all()]
        if not module_ids:
            return
        total_lessons = (await self.db.execute(select(func.count()).select_from(Lesson).where(Lesson.module_id.in_(module_ids)))).scalar() or 0
        total_quizzes = (await self.db.execute(select(func.count()).select_from(Quiz).where(Quiz.module_id.in_(module_ids)))).scalar() or 0
        total_labs = (await self.db.execute(select(func.count()).select_from(Lab).where(Lab.module_id.in_(module_ids)))).scalar() or 0
        total_items = total_lessons + total_quizzes + total_labs
        if total_items == 0:
            return
        completed_lessons = (await self.db.execute(select(func.count()).select_from(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id.in_(module_ids), UserProgress.lesson_id.isnot(None), UserProgress.completed == True))).scalar() or 0  # noqa: E712
        passed_quizzes = (await self.db.execute(select(func.count(func.distinct(QuizAttempt.quiz_id))).where(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id.in_(select(Quiz.id).where(Quiz.module_id.in_(module_ids))), QuizAttempt.passed == True))).scalar() or 0  # noqa: E712
        passed_labs = (await self.db.execute(select(func.count(func.distinct(LabSubmission.lab_id))).where(LabSubmission.user_id == user_id, LabSubmission.lab_id.in_(select(Lab.id).where(Lab.module_id.in_(module_ids))), LabSubmission.passed == True))).scalar() or 0  # noqa: E712
        completed_items = completed_lessons + passed_quizzes + passed_labs
        progress = min(100, round((completed_items / total_items) * 100))
        enrollment_result = await self.db.execute(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
        enrollment = enrollment_result.scalar_one_or_none()
        if enrollment:
            enrollment.progress = progress
            enrollment.last_accessed_at = datetime.now(timezone.utc)
            if progress == 100:
                enrollment.completed_at = datetime.now(timezone.utc)
            await self.db.flush()

    async def _calculate_score(self, quiz_id: str, answers: dict) -> int:
        from app.models.assessment import Question
        result = await self.db.execute(select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order))
        questions = result.scalars().all()
        if not questions:
            return 0
        correct_count = 0
        for question in questions:
            user_answer = answers.get(question.id)
            if user_answer is None:
                continue
            expected = question.correct_answer
            if isinstance(expected, list):
                if isinstance(user_answer, list) and sorted(str(a) for a in user_answer) == sorted(str(e) for e in expected):
                    correct_count += 1
            elif isinstance(expected, dict):
                answer_val = expected.get("value", expected)
                if str(user_answer).strip().lower() == str(answer_val).strip().lower():
                    correct_count += 1
            else:
                if str(user_answer).strip().lower() == str(expected).strip().lower():
                    correct_count += 1
        return round((correct_count / len(questions)) * 100)

    async def get_detailed_progress(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment).options(selectinload(Enrollment.course)).where(Enrollment.user_id == user_id)
        )
        enrollments = list(result.scalars().all())
        data = []
        for e in enrollments:
            course_progress = await self.get_detailed_course_progress(user_id, e.course_id)
            data.append({
                "courseId": e.course_id,
                "courseTitle": e.course.title if e.course else "",
                "progress": e.progress or 0,
                "enrolledAt": e.enrolled_at.isoformat() if e.enrolled_at else None,
                "modules": course_progress.get("modules", []),
            })
        return data

    async def get_or_create_progress(self, user_id: str, module_id: str) -> UserProgress:
        result = await self.db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        )
        progress = result.scalar_one_or_none()
        if progress is None:
            progress = UserProgress(user_id=user_id, module_id=module_id, progress=0, last_access=datetime.now(timezone.utc))
            self.db.add(progress)
            await self.db.flush()
            result = await self.db.execute(
                select(UserProgress).where(UserProgress.id == progress.id)
            )
            progress = result.scalar_one()
        return progress

    async def get_module_progress(self, user_id: str, module_id: str) -> dict:
        result = await self.db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.module_id == module_id)
        )
        progress = result.scalar_one_or_none()
        if progress is None:
            return {"moduleId": module_id, "progress": 0, "completedAt": None}
        return {
            "moduleId": progress.module_id,
            "progress": progress.progress or 0,
            "completedAt": progress.completed_at.isoformat() if progress.completed_at else None,
        }

    async def mark_lab_complete(self, user_id: str, module_id: str) -> None:
        await self._recalculate_course_progress(user_id, module_id)

    async def update_project_status(self, user_id: str, module_id: str, status: str) -> None:
        await self._recalculate_course_progress(user_id, module_id)
