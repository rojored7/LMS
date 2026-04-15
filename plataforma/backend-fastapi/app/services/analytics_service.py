from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.gamification import Badge, Certificate, UserBadge
from app.models.progress import Enrollment
from app.models.user import User, UserRole

logger = structlog.get_logger()


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_platform_stats(self) -> dict:
        total_users = (await self.db.execute(select(func.count()).select_from(User))).scalar() or 0
        total_courses = (await self.db.execute(select(func.count()).select_from(Course))).scalar() or 0
        total_enrollments = (await self.db.execute(select(func.count()).select_from(Enrollment))).scalar() or 0
        total_certificates = (await self.db.execute(select(func.count()).select_from(Certificate))).scalar() or 0
        total_badges_awarded = (await self.db.execute(select(func.count()).select_from(UserBadge))).scalar() or 0

        avg_progress_result = await self.db.execute(select(func.avg(Enrollment.progress)))
        avg_progress = avg_progress_result.scalar() or 0.0

        completed_result = await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.completed_at.isnot(None))
        )
        completed_enrollments = completed_result.scalar() or 0
        completion_rate = round((completed_enrollments / total_enrollments) * 100, 2) if total_enrollments > 0 else 0.0

        return {
            "totalUsers": total_users,
            "totalCourses": total_courses,
            "totalEnrollments": total_enrollments,
            "totalCertificates": total_certificates,
            "totalBadgesAwarded": total_badges_awarded,
            "averageProgress": round(avg_progress, 2),
            "completionRate": completion_rate,
            "completedEnrollments": completed_enrollments,
        }

    async def get_enrollment_trends(self, days: int = 30) -> list[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(
                func.date(Enrollment.created_at).label("date"),
                func.count().label("count"),
            )
            .where(Enrollment.created_at >= cutoff)
            .group_by(func.date(Enrollment.created_at))
            .order_by(func.date(Enrollment.created_at))
        )
        rows = result.all()
        return [{"date": str(r.date), "count": r.count} for r in rows]

    async def get_course_stats(self) -> list[dict]:
        result = await self.db.execute(
            select(Course).where(Course.is_published.is_(True))
        )
        courses = list(result.scalars().all())

        stats = []
        for course in courses:
            enroll_count = (
                await self.db.execute(
                    select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)
                )
            ).scalar() or 0

            avg_progress = (
                await self.db.execute(
                    select(func.avg(Enrollment.progress)).where(Enrollment.course_id == course.id)
                )
            ).scalar() or 0.0

            completed = (
                await self.db.execute(
                    select(func.count()).select_from(Enrollment).where(
                        Enrollment.course_id == course.id, Enrollment.completed_at.isnot(None)
                    )
                )
            ).scalar() or 0

            stats.append({
                "courseId": course.id,
                "courseTitle": course.title,
                "enrollmentCount": enroll_count,
                "averageProgress": round(avg_progress, 2),
                "completedCount": completed,
                "completionRate": round((completed / enroll_count) * 100, 2) if enroll_count > 0 else 0.0,
            })

        return stats

    async def get_user_activity(self, days: int = 7) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        new_users = (
            await self.db.execute(
                select(func.count()).select_from(User).where(User.created_at >= cutoff)
            )
        ).scalar() or 0
        new_enrollments = (
            await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.created_at >= cutoff)
            )
        ).scalar() or 0
        active_users = (
            await self.db.execute(
                select(func.count()).select_from(User).where(User.last_login_at >= cutoff)
            )
        ).scalar() or 0

        return {
            "period": f"last_{days}_days",
            "newUsers": new_users,
            "newEnrollments": new_enrollments,
            "activeUsers": active_users,
        }

    async def get_user_distribution(self) -> list[dict]:
        result = await self.db.execute(
            select(User.role, func.count().label("count")).group_by(User.role)
        )
        return [{"role": str(r.role.value) if hasattr(r.role, 'value') else str(r.role), "count": r.count} for r in result.all()]

    async def get_recent_activity(self, limit: int = 10) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment, User, Course)
            .join(User, Enrollment.user_id == User.id)
            .join(Course, Enrollment.course_id == Course.id)
            .order_by(Enrollment.enrolled_at.desc())
            .limit(limit)
        )
        rows = result.all()
        data = []
        for enrollment, user, course in rows:
            activity_type = "completion" if enrollment.completed_at else "enrollment"
            timestamp = enrollment.completed_at if enrollment.completed_at else enrollment.enrolled_at
            data.append({
                "type": activity_type,
                "userName": user.name or user.email,
                "userEmail": user.email,
                "courseTitle": course.title,
                "timestamp": timestamp.isoformat() if timestamp else None,
            })
        return data

    async def get_comparative_stats(self) -> dict:
        now = datetime.now(timezone.utc)
        current_start = now - timedelta(days=30)
        previous_start = now - timedelta(days=60)

        def _pct(current: int, previous: int) -> float:
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round((current - previous) / previous * 100, 1)

        cur_users = (await self.db.execute(
            select(func.count()).select_from(User).where(User.created_at >= current_start)
        )).scalar() or 0
        prev_users = (await self.db.execute(
            select(func.count()).select_from(User).where(User.created_at >= previous_start, User.created_at < current_start)
        )).scalar() or 0

        cur_enrollments = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.enrolled_at >= current_start)
        )).scalar() or 0
        prev_enrollments = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.enrolled_at >= previous_start, Enrollment.enrolled_at < current_start)
        )).scalar() or 0

        cur_completions = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.completed_at >= current_start)
        )).scalar() or 0
        prev_completions = (await self.db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.completed_at >= previous_start, Enrollment.completed_at < current_start)
        )).scalar() or 0

        cur_active = (await self.db.execute(
            select(func.count()).select_from(User).where(User.last_login_at >= current_start)
        )).scalar() or 0
        prev_active = (await self.db.execute(
            select(func.count()).select_from(User).where(User.last_login_at >= previous_start, User.last_login_at < current_start)
        )).scalar() or 0

        return {
            "users": {"current": cur_users, "previous": prev_users, "changePercent": _pct(cur_users, prev_users)},
            "enrollments": {"current": cur_enrollments, "previous": prev_enrollments, "changePercent": _pct(cur_enrollments, prev_enrollments)},
            "completions": {"current": cur_completions, "previous": prev_completions, "changePercent": _pct(cur_completions, prev_completions)},
            "activeStudents": {"current": cur_active, "previous": prev_active, "changePercent": _pct(cur_active, prev_active)},
        }
