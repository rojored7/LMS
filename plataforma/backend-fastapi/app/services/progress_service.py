import json
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.assessment import Lab, LabSubmission, Quiz, QuizAttempt
from app.models.course import Course, Lesson, Module
from app.models.progress import Enrollment, UserProgress
from app.models.user import User

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
        await self.recalculate_course_progress(user_id, lesson.module_id)
        return progress

    async def submit_quiz_attempt(self, user_id: str, quiz_id: str, answers: dict) -> QuizAttempt:
        result = await self.db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if quiz is None:
            raise NotFoundError("Quiz no encontrado")
        count_result = await self.db.execute(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.quiz_id == quiz_id))
        if (count_result.scalar() or 0) >= quiz.attempts:
            raise ConflictError(f"Limite de intentos alcanzado ({quiz.attempts})")
        from app.models.assessment import Question
        from app.services.scoring import calculate_quiz_score
        q_result = await self.db.execute(
            select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order)
        )
        questions = list(q_result.scalars().all())
        correct, total = calculate_quiz_score(questions, answers) if questions else (0, 0)
        score = round((correct / total) * 100) if total > 0 else 0
        passed = score >= quiz.passing_score
        attempt = QuizAttempt(user_id=user_id, quiz_id=quiz_id, answers=answers, score=score, passed=passed, completed_at=datetime.now(timezone.utc))
        self.db.add(attempt)
        await self.db.flush()
        await self.db.refresh(attempt)
        if passed:
            await self.recalculate_course_progress(user_id, quiz.module_id)
        return attempt

    async def submit_lab(self, user_id: str, lab_id: str, code: str, language: str, passed: bool | None = None, stdout: str = "", stderr: str = "", exit_code: int = 0, execution_time: int = 0) -> LabSubmission:
        result = await self.db.execute(select(Lab).where(Lab.id == lab_id))
        lab = result.scalar_one_or_none()
        if lab is None:
            raise NotFoundError("Lab no encontrado")
        if passed is None:
            from app.services.executor_client import executor_client
            test_code = json.dumps(lab.tests) if isinstance(lab.tests, dict) else None
            exec_result = await executor_client.execute_code(code=code, language=language, test_code=test_code)
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
            await self.recalculate_course_progress(user_id, lab.module_id)
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

        # Totales por modulo
        lesson_totals = await self.db.execute(select(Lesson.module_id, func.count().label("cnt")).where(Lesson.module_id.in_(module_ids)).group_by(Lesson.module_id))
        lesson_totals_map = {row.module_id: row.cnt for row in lesson_totals}
        quiz_totals = await self.db.execute(select(Quiz.module_id, func.count().label("cnt")).where(Quiz.module_id.in_(module_ids)).group_by(Quiz.module_id))
        quiz_totals_map = {row.module_id: row.cnt for row in quiz_totals}
        lab_totals = await self.db.execute(select(Lab.module_id, func.count().label("cnt")).where(Lab.module_id.in_(module_ids)).group_by(Lab.module_id))
        lab_totals_map = {row.module_id: row.cnt for row in lab_totals}

        # Completados por modulo
        lesson_completed = await self.db.execute(select(UserProgress.module_id, func.count().label("cnt")).where(UserProgress.user_id == user_id, UserProgress.module_id.in_(module_ids), UserProgress.lesson_id.isnot(None), UserProgress.completed == True).group_by(UserProgress.module_id))  # noqa: E712
        lesson_completed_map = {row.module_id: row.cnt for row in lesson_completed}
        quiz_passed = await self.db.execute(select(Quiz.module_id, func.count(func.distinct(QuizAttempt.quiz_id)).label("cnt")).join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id).where(Quiz.module_id.in_(module_ids), QuizAttempt.user_id == user_id, QuizAttempt.passed == True).group_by(Quiz.module_id))  # noqa: E712
        quiz_passed_map = {row.module_id: row.cnt for row in quiz_passed}
        lab_passed = await self.db.execute(select(Lab.module_id, func.count(func.distinct(LabSubmission.lab_id)).label("cnt")).join(LabSubmission, LabSubmission.lab_id == Lab.id).where(Lab.module_id.in_(module_ids), LabSubmission.user_id == user_id, LabSubmission.passed == True).group_by(Lab.module_id))  # noqa: E712
        lab_passed_map = {row.module_id: row.cnt for row in lab_passed}

        # Agregados
        total_all = sum(lesson_totals_map.values()) + sum(quiz_totals_map.values()) + sum(lab_totals_map.values())
        completed_all = sum(lesson_completed_map.values()) + sum(quiz_passed_map.values()) + sum(lab_passed_map.values())
        overall = min(100, round((completed_all / total_all) * 100)) if total_all > 0 else 0

        module_progress = []
        for mod in modules:
            l_total = lesson_totals_map.get(mod.id, 0)
            l_done = lesson_completed_map.get(mod.id, 0)
            q_total = quiz_totals_map.get(mod.id, 0)
            q_done = quiz_passed_map.get(mod.id, 0)
            lb_total = lab_totals_map.get(mod.id, 0)
            lb_done = lab_passed_map.get(mod.id, 0)
            item_total = l_total + q_total + lb_total
            item_done = l_done + q_done + lb_done
            pct = min(100, round((item_done / item_total) * 100)) if item_total > 0 else 0
            module_progress.append({
                "moduleId": mod.id, "moduleTitle": mod.title, "progress": pct,
                "lessons": {"total": l_total, "completed": l_done},
                "quizzes": {"total": q_total, "passed": q_done},
                "labs": {"total": lb_total, "passed": lb_done},
            })
        return {"overallProgress": overall, "modules": module_progress}

    async def get_lesson_progress(self, user_id: str, lesson_id: str) -> dict | None:
        result = await self.db.execute(select(UserProgress).where(UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id))
        progress = result.scalar_one_or_none()
        if progress is None:
            return None
        return {"completed": progress.completed, "completedAt": progress.completed_at.isoformat() if progress.completed_at else None, "timeSpent": progress.time_spent if hasattr(progress, "time_spent") else 0}

    async def recalculate_course_progress(self, user_id: str, module_id: str) -> None:
        # Query 1: Get course_id from module
        module_result = await self.db.execute(select(Module).where(Module.id == module_id))
        module = module_result.scalar_one_or_none()
        if module is None:
            return
        course_id = module.course_id

        # Query 2: Get all module_ids for the course
        modules_result = await self.db.execute(
            select(Module.id).where(Module.course_id == course_id)
        )
        module_ids = [m for m in modules_result.scalars().all()]
        if not module_ids:
            return

        # Query 3: Get all totals in one query using subqueries
        lessons_sq = (
            select(func.count())
            .select_from(Lesson)
            .where(Lesson.module_id.in_(module_ids))
            .correlate(None)
            .scalar_subquery()
        )
        quizzes_sq = (
            select(func.count())
            .select_from(Quiz)
            .where(Quiz.module_id.in_(module_ids))
            .correlate(None)
            .scalar_subquery()
        )
        labs_sq = (
            select(func.count())
            .select_from(Lab)
            .where(Lab.module_id.in_(module_ids))
            .correlate(None)
            .scalar_subquery()
        )
        totals = await self.db.execute(
            select(lessons_sq.label("lessons"), quizzes_sq.label("quizzes"), labs_sq.label("labs"))
        )
        row = totals.one()
        total_items = (row.lessons or 0) + (row.quizzes or 0) + (row.labs or 0)
        if total_items == 0:
            return

        # Query 4: Get all completed counts in one query
        done_lessons_sq = (
            select(func.count())
            .select_from(UserProgress)
            .where(
                UserProgress.user_id == user_id,
                UserProgress.module_id.in_(module_ids),
                UserProgress.lesson_id.isnot(None),
                UserProgress.completed == True,  # noqa: E712
            )
            .correlate(None)
            .scalar_subquery()
        )
        done_quizzes_sq = (
            select(func.count(func.distinct(QuizAttempt.quiz_id)))
            .where(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id.in_(
                    select(Quiz.id).where(Quiz.module_id.in_(module_ids))
                ),
                QuizAttempt.passed == True,  # noqa: E712
            )
            .correlate(None)
            .scalar_subquery()
        )
        done_labs_sq = (
            select(func.count(func.distinct(LabSubmission.lab_id)))
            .where(
                LabSubmission.user_id == user_id,
                LabSubmission.lab_id.in_(
                    select(Lab.id).where(Lab.module_id.in_(module_ids))
                ),
                LabSubmission.passed == True,  # noqa: E712
            )
            .correlate(None)
            .scalar_subquery()
        )
        completed = await self.db.execute(
            select(
                done_lessons_sq.label("lessons"),
                done_quizzes_sq.label("quizzes"),
                done_labs_sq.label("labs"),
            )
        )
        crow = completed.one()
        completed_items = (crow.lessons or 0) + (crow.quizzes or 0) + (crow.labs or 0)

        # Query 5: Update enrollment
        progress = min(100, round((completed_items / total_items) * 100))
        enrollment_result = await self.db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id, Enrollment.course_id == course_id
            )
        )
        enrollment = enrollment_result.scalar_one_or_none()
        if enrollment:
            enrollment.progress = progress
            enrollment.last_accessed_at = datetime.now(timezone.utc)
            if progress >= 100:
                first_completion = enrollment.completed_at is None
                enrollment.completed_at = datetime.now(timezone.utc)
                if first_completion:
                    course = await self.db.get(Course, enrollment.course_id)
                    if course:
                        user = await self.db.get(User, enrollment.user_id)
                        if user:
                            user.xp = (user.xp or 0) + course.score
                            from app.services.badge_service import BadgeService
                            badge_svc = BadgeService(self.db)
                            await badge_svc.award_course_completion_badge(
                                user_id=user.id, course=course, enrollment=enrollment,
                            )
            await self.db.flush()

    async def get_detailed_progress(self, user_id: str, skip: int = 0, limit: int = 50) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment).options(selectinload(Enrollment.course))
            .where(Enrollment.user_id == user_id)
            .offset(skip).limit(limit)
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
        await self.recalculate_course_progress(user_id, module_id)

    async def update_project_status(self, user_id: str, module_id: str, status: str) -> None:
        await self.recalculate_course_progress(user_id, module_id)
