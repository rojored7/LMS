from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.middleware.error_handler import AuthorizationError, NotFoundError
from app.models.assessment import Project, ProjectSubmission, QuizAttempt
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
        result = await self.db.execute(
            select(Course).where(Course.author_id == author_id).order_by(Course.created_at.desc())
        )
        courses = result.scalars().all()
        data = []
        for course in courses:
            enrollment_count = (await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)
            )).scalar() or 0
            avg_progress = (await self.db.execute(
                select(func.avg(Enrollment.progress)).where(Enrollment.course_id == course.id)
            )).scalar() or 0.0
            data.append({
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "isPublished": course.is_published,
                "enrollmentCount": enrollment_count,
                "avgProgress": round(float(avg_progress), 1),
                "createdAt": course.created_at.isoformat() if course.created_at else None,
            })
        return data

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
        rows = enrollments_result.all()
        data = []
        for enrollment, user in rows:
            data.append({
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "enrolledAt": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                "progress": float(enrollment.progress) if enrollment.progress else 0.0,
                "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
            })
        return data

    async def get_gradebook(self, course_id: str, author_id: str) -> list[dict]:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        if course.author_id != author_id:
            raise AuthorizationError("No tiene permisos sobre este curso")

        enrollments_result = await self.db.execute(
            select(Enrollment, User).join(User, Enrollment.user_id == User.id).where(
                Enrollment.course_id == course_id
            ).order_by(User.name)
        )
        rows = enrollments_result.all()

        data = []
        for enrollment, user in rows:
            quiz_avg = (await self.db.execute(
                select(func.avg(QuizAttempt.score)).where(QuizAttempt.user_id == user.id)
            )).scalar()

            modules_completed = (await self.db.execute(
                select(func.count()).select_from(UserProgress).where(
                    UserProgress.user_id == user.id,
                    UserProgress.completed == True,  # noqa: E712
                    UserProgress.enrollment_id == enrollment.id,
                )
            )).scalar() or 0

            data.append({
                "userId": user.id,
                "name": user.name,
                "email": user.email,
                "progress": float(enrollment.progress) if enrollment.progress else 0.0,
                "quizAvgScore": round(float(quiz_avg), 1) if quiz_avg else None,
                "modulesCompleted": modules_completed,
                "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            })
        return data

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

        courses_result = await self.db.execute(
            select(Course).where(Course.author_id == author_id).order_by(Course.created_at.desc())
        )
        courses = courses_result.scalars().all()

        per_course = []
        for course in courses:
            enroll_count = (await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)
            )).scalar() or 0
            avg_prog = (await self.db.execute(
                select(func.avg(Enrollment.progress)).where(Enrollment.course_id == course.id)
            )).scalar() or 0.0
            per_course.append({
                "courseId": course.id,
                "title": course.title,
                "enrollments": enroll_count,
                "avgProgress": round(float(avg_prog), 1),
            })

        return {
            "totalEnrollments": total_enrollments,
            "completedEnrollments": completed_enrollments,
            "completionRate": completion_rate,
            "courseStats": per_course,
        }
