from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased
import structlog

from app.middleware.error_handler import AuthorizationError, NotFoundError
from app.models.assessment import Project, ProjectSubmission, Quiz, QuizAttempt
from app.models.course import Course, Module
from app.models.progress import Enrollment, UserProgress
from app.models.user import User

logger = structlog.get_logger()


class InstructorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_dashboard_stats(self, author_id: str) -> dict:
        total_courses = (await self.db.execute(
            select(func.count()).select_from(Course).where(Course.author_id == author_id)
        )).scalar() or 0

        course_ids_q = select(Course.id).where(Course.author_id == author_id)
        total_students = (await self.db.execute(
            select(func.count(func.distinct(Enrollment.user_id))).where(Enrollment.course_id.in_(course_ids_q))
        )).scalar() or 0

        avg_progress = (await self.db.execute(
            select(func.avg(Enrollment.progress)).where(Enrollment.course_id.in_(course_ids_q))
        )).scalar() or 0.0

        pending_submissions = (await self.db.execute(
            select(func.count()).select_from(ProjectSubmission).where(
                ProjectSubmission.status == "PENDING",
                ProjectSubmission.project_id.in_(
                    select(Project.id).where(Project.course_id.in_(course_ids_q))
                ),
            )
        )).scalar() or 0

        return {
            "totalCourses": total_courses,
            "totalStudents": total_students,
            "avgProgress": round(float(avg_progress), 1),
            "pendingSubmissions": pending_submissions,
        }

    async def get_instructor_courses(self, author_id: str) -> list[dict]:
        enroll_count_q = (
            select(func.count(Enrollment.id))
            .where(Enrollment.course_id == Course.id)
            .correlate(Course)
            .scalar_subquery()
        )
        avg_progress_q = (
            select(func.coalesce(func.avg(Enrollment.progress), 0))
            .where(Enrollment.course_id == Course.id)
            .correlate(Course)
            .scalar_subquery()
        )
        result = await self.db.execute(
            select(Course, enroll_count_q.label("enroll_count"), avg_progress_q.label("avg_prog"))
            .where(Course.author_id == author_id)
            .order_by(Course.created_at.desc())
        )
        rows = result.all()
        return [
            {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "isPublished": course.is_published,
                "enrollmentCount": enroll_count or 0,
                "avgProgress": round(float(avg_prog or 0), 1),
                "createdAt": course.created_at.isoformat() if course.created_at else None,
            }
            for course, enroll_count, avg_prog in rows
        ]

    async def get_course_students(self, course_id: str, author_id: str) -> list[dict]:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        if course.author_id != author_id:
            raise AuthorizationError("No tiene permisos sobre este curso")

        enrollments_result = await self.db.execute(
            select(Enrollment, User).join(User, Enrollment.user_id == User.id).where(
                Enrollment.course_id == course_id
            ).order_by(Enrollment.enrolled_at.desc())
        )
        return [
            {
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "enrolledAt": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                "progress": float(enrollment.progress) if enrollment.progress else 0.0,
                "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
            }
            for enrollment, user in enrollments_result.all()
        ]

    async def get_gradebook(self, course_id: str, author_id: str) -> list[dict]:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        if course.author_id != author_id:
            raise AuthorizationError("No tiene permisos sobre este curso")

        quiz_avg_q = (
            select(func.avg(QuizAttempt.score))
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .join(Module, Quiz.module_id == Module.id)
            .where(QuizAttempt.user_id == Enrollment.user_id, Module.course_id == course_id)
            .correlate(Enrollment)
            .scalar_subquery()
        )
        modules_done_q = (
            select(func.count())
            .select_from(UserProgress)
            .where(
                UserProgress.user_id == Enrollment.user_id,
                UserProgress.enrollment_id == Enrollment.id,
                UserProgress.completed == True,  # noqa: E712
            )
            .correlate(Enrollment)
            .scalar_subquery()
        )
        enrollments_result = await self.db.execute(
            select(Enrollment, User, quiz_avg_q.label("quiz_avg"), modules_done_q.label("modules_done"))
            .join(User, Enrollment.user_id == User.id)
            .where(Enrollment.course_id == course_id)
            .order_by(User.name)
        )
        return [
            {
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "progress": float(enrollment.progress) if enrollment.progress else 0.0,
                "quizAvgScore": round(float(quiz_avg), 1) if quiz_avg else None,
                "modulesCompleted": modules_done or 0,
                "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            }
            for enrollment, user, quiz_avg, modules_done in enrollments_result.all()
        ]

    async def get_instructor_analytics(self, author_id: str) -> dict:
        course_ids_q = select(Course.id).where(Course.author_id == author_id)

        total_enrollments = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.course_id.in_(course_ids_q))
        )).scalar() or 0

        completed_enrollments = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(
                Enrollment.course_id.in_(course_ids_q),
                Enrollment.completed_at.isnot(None),
            )
        )).scalar() or 0

        completion_rate = round((completed_enrollments / total_enrollments * 100), 1) if total_enrollments > 0 else 0.0

        enroll_count_q = (
            select(func.count(Enrollment.id))
            .where(Enrollment.course_id == Course.id)
            .correlate(Course)
            .scalar_subquery()
        )
        avg_prog_q = (
            select(func.coalesce(func.avg(Enrollment.progress), 0))
            .where(Enrollment.course_id == Course.id)
            .correlate(Course)
            .scalar_subquery()
        )
        courses_result = await self.db.execute(
            select(Course.id, Course.title, enroll_count_q.label("enroll_count"), avg_prog_q.label("avg_prog"))
            .where(Course.author_id == author_id)
            .order_by(Course.created_at.desc())
        )
        per_course = [
            {
                "courseId": cid,
                "title": title,
                "enrollments": enroll_count or 0,
                "avgProgress": round(float(avg_prog or 0), 1),
            }
            for cid, title, enroll_count, avg_prog in courses_result.all()
        ]

        return {
            "totalEnrollments": total_enrollments,
            "completedEnrollments": completed_enrollments,
            "completionRate": completion_rate,
            "courseStats": per_course,
        }
