import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.gamification import Certificate
from app.models.progress import Enrollment
from app.models.user import User, UserRole

logger = structlog.get_logger()


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_stats(self) -> dict:
        total_users_result = await self.db.execute(select(func.count()).select_from(User))
        total_users = total_users_result.scalar() or 0

        students_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.STUDENT)
        )
        total_students = students_result.scalar() or 0

        instructors_result = await self.db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.INSTRUCTOR)
        )
        total_instructors = instructors_result.scalar() or 0

        total_courses_result = await self.db.execute(select(func.count()).select_from(Course))
        total_courses = total_courses_result.scalar() or 0

        published_courses_result = await self.db.execute(
            select(func.count()).select_from(Course).where(Course.published.is_(True))
        )
        published_courses = published_courses_result.scalar() or 0

        total_enrollments_result = await self.db.execute(select(func.count()).select_from(Enrollment))
        total_enrollments = total_enrollments_result.scalar() or 0

        total_certificates_result = await self.db.execute(select(func.count()).select_from(Certificate))
        total_certificates = total_certificates_result.scalar() or 0

        return {
            "totalUsers": total_users,
            "totalStudents": total_students,
            "totalInstructors": total_instructors,
            "totalCourses": total_courses,
            "publishedCourses": published_courses,
            "totalEnrollments": total_enrollments,
            "totalCertificates": total_certificates,
        }

    async def get_recent_enrollments(self, limit: int = 10) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment).order_by(Enrollment.created_at.desc()).limit(limit)
        )
        enrollments = list(result.scalars().all())
        return [
            {
                "id": e.id,
                "userId": e.user_id,
                "courseId": e.course_id,
                "progress": e.progress,
                "createdAt": e.created_at.isoformat(),
            }
            for e in enrollments
        ]

    async def bulk_update_role(self, user_ids: list[str], role: str) -> int:
        count = 0
        for uid in user_ids:
            result = await self.db.execute(select(User).where(User.id == uid))
            user = result.scalar_one_or_none()
            if user:
                user.role = UserRole(role)
                count += 1
        await self.db.flush()
        logger.info("bulk_role_update", count=count, role=role)
        return count
