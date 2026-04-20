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
        # Single query with scalar subqueries instead of 7 sequential queries
        total_users_sq = select(func.count()).select_from(User).correlate(None).scalar_subquery()
        total_students_sq = select(func.count()).select_from(User).where(User.role == UserRole.STUDENT).correlate(None).scalar_subquery()
        total_instructors_sq = select(func.count()).select_from(User).where(User.role == UserRole.INSTRUCTOR).correlate(None).scalar_subquery()
        total_courses_sq = select(func.count()).select_from(Course).correlate(None).scalar_subquery()
        published_courses_sq = select(func.count()).select_from(Course).where(Course.is_published.is_(True)).correlate(None).scalar_subquery()
        total_enrollments_sq = select(func.count()).select_from(Enrollment).correlate(None).scalar_subquery()
        total_certificates_sq = select(func.count()).select_from(Certificate).correlate(None).scalar_subquery()

        result = await self.db.execute(
            select(
                total_users_sq.label("total_users"),
                total_students_sq.label("total_students"),
                total_instructors_sq.label("total_instructors"),
                total_courses_sq.label("total_courses"),
                published_courses_sq.label("published_courses"),
                total_enrollments_sq.label("total_enrollments"),
                total_certificates_sq.label("total_certificates"),
            )
        )
        row = result.one()
        return {
            "totalUsers": row.total_users or 0,
            "totalStudents": row.total_students or 0,
            "totalInstructors": row.total_instructors or 0,
            "totalCourses": row.total_courses or 0,
            "publishedCourses": row.published_courses or 0,
            "totalEnrollments": row.total_enrollments or 0,
            "totalCertificates": row.total_certificates or 0,
        }

    async def get_recent_enrollments(self, limit: int = 10) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment).order_by(Enrollment.enrolled_at.desc()).limit(limit)
        )
        enrollments = list(result.scalars().all())
        return [
            {
                "id": e.id,
                "userId": e.user_id,
                "courseId": e.course_id,
                "progress": e.progress,
                "createdAt": e.enrolled_at.isoformat() if e.enrolled_at else None,
            }
            for e in enrollments
        ]

    async def bulk_update_role(self, user_ids: list[str], role: str) -> int:
        result = await self.db.execute(select(User).where(User.id.in_(user_ids)))
        users = list(result.scalars().all())
        new_role = UserRole(role)
        for user in users:
            user.role = new_role
        await self.db.flush()
        logger.info("bulk_role_update", count=len(users), role=role)
        return len(users)
