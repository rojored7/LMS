from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Lesson, Module
from app.models.gamification import Badge, Certificate, UserBadge
from app.models.progress import Enrollment, UserProgress
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
                cast(Enrollment.enrolled_at, Date).label("date"),
                func.count().label("count"),
            )
            .where(Enrollment.enrolled_at >= cutoff)
            .group_by(cast(Enrollment.enrolled_at, Date))
            .order_by(cast(Enrollment.enrolled_at, Date))
        )
        rows = result.all()
        return [{"date": str(r.date), "count": r.count} for r in rows]

    async def get_course_stats(self) -> list[dict]:
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
        completed_q = (
            select(func.count(Enrollment.id))
            .where(Enrollment.course_id == Course.id, Enrollment.completed_at.isnot(None))
            .correlate(Course)
            .scalar_subquery()
        )
        result = await self.db.execute(
            select(
                Course.id, Course.title, Course.score,
                enroll_count_q.label("enroll_count"),
                avg_progress_q.label("avg_progress"),
                completed_q.label("completed"),
            )
            .where(Course.is_published.is_(True))
        )
        stats = []
        for cid, title, score, enroll_count, avg_progress, completed in result.all():
            ec = enroll_count or 0
            stats.append({
                "courseId": cid,
                "courseTitle": title,
                "score": score or 1,
                "enrollmentCount": ec,
                "averageProgress": round(float(avg_progress or 0), 2),
                "completedCount": completed or 0,
                "completionRate": round(((completed or 0) / ec) * 100, 2) if ec > 0 else 0.0,
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
                select(func.count()).select_from(Enrollment).where(Enrollment.enrolled_at >= cutoff)
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
                "user_name": user.name or user.email,
                "user_email": user.email,
                "course_title": course.title,
                "action": activity_type,
                "created_at": timestamp.isoformat() if timestamp else None,
            })
        return data

    # estimated_time in Lesson model is stored in minutes; time_spent in UserProgress is seconds
    _ESTIMATED_TIME_TO_SECONDS = 60

    @staticmethod
    def _classify_reading(ratio: float) -> str:
        if ratio < 0.5:
            return "skimming"
        if ratio > 1.5:
            return "deep_read"
        return "on_track"

    async def get_users_time_summary(
        self, course_id: str | None = None, limit: int = 50, offset: int = 0
    ) -> list[dict]:
        q = (
            select(
                User.id.label("user_id"),
                User.name.label("user_name"),
                User.email.label("user_email"),
                Course.id.label("course_id"),
                Course.title.label("course_title"),
                func.sum(UserProgress.time_spent).label("time_seconds"),
                func.count(UserProgress.id).label("lessons_completed"),
            )
            .join(UserProgress, UserProgress.user_id == User.id)
            .join(Module, UserProgress.module_id == Module.id)
            .join(Course, Module.course_id == Course.id)
            .where(
                UserProgress.lesson_id.isnot(None),
                UserProgress.completed.is_(True),
            )
            .group_by(User.id, User.name, User.email, Course.id, Course.title)
            .order_by(func.sum(UserProgress.time_spent).desc())
        )
        if course_id:
            q = q.where(Course.id == course_id)

        result = await self.db.execute(q.offset(offset).limit(limit))
        rows = result.all()

        users: dict[str, dict] = {}
        for row in rows:
            uid = row.user_id
            if uid not in users:
                users[uid] = {
                    "userId": uid,
                    "userName": row.user_name or row.user_email,
                    "userEmail": row.user_email,
                    "totalTimeSeconds": 0,
                    "courseBreakdown": [],
                }
            time_s = int(row.time_seconds or 0)
            completed = int(row.lessons_completed or 0)
            avg = round(time_s / completed) if completed > 0 else 0
            users[uid]["totalTimeSeconds"] += time_s
            users[uid]["courseBreakdown"].append({
                "courseId": row.course_id,
                "courseTitle": row.course_title,
                "timeSeconds": time_s,
                "lessonsCompleted": completed,
                "avgTimePerLessonSeconds": avg,
            })

        return list(users.values())

    async def get_course_lesson_time_stats(self, course_id: str) -> list[dict]:
        result = await self.db.execute(
            select(
                Lesson.id.label("lesson_id"),
                Lesson.title.label("lesson_title"),
                Lesson.estimated_time.label("estimated_time"),
                func.avg(UserProgress.time_spent).label("avg_time"),
                func.count(UserProgress.id).label("completions"),
            )
            .join(UserProgress, UserProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .where(
                Module.course_id == course_id,
                UserProgress.completed.is_(True),
            )
            .group_by(Lesson.id, Lesson.title, Lesson.estimated_time)
            .order_by(Lesson.id)
        )
        rows = result.all()
        stats = []
        for row in rows:
            avg_real = round(float(row.avg_time or 0))
            estimated_s = int(row.estimated_time or 0) * self._ESTIMATED_TIME_TO_SECONDS
            ratio = round(avg_real / estimated_s, 2) if estimated_s > 0 else 0.0
            stats.append({
                "lessonId": row.lesson_id,
                "lessonTitle": row.lesson_title,
                "estimatedTimeSeconds": estimated_s,
                "avgRealTimeSeconds": avg_real,
                "completions": int(row.completions or 0),
                "ratio": ratio,
                "classification": self._classify_reading(ratio),
            })
        return stats

    async def get_user_course_lesson_times(self, user_id: str, course_id: str) -> list[dict]:
        result = await self.db.execute(
            select(
                Lesson.id.label("lesson_id"),
                Lesson.title.label("lesson_title"),
                Lesson.estimated_time.label("estimated_time"),
                UserProgress.time_spent.label("real_time"),
                UserProgress.completed_at.label("completed_at"),
            )
            .join(UserProgress, UserProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .where(
                UserProgress.user_id == user_id,
                Module.course_id == course_id,
                UserProgress.completed.is_(True),
            )
            .order_by(Module.order, Lesson.order)
        )
        rows = result.all()
        items = []
        for row in rows:
            real_s = int(row.real_time or 0)
            estimated_s = int(row.estimated_time or 0) * self._ESTIMATED_TIME_TO_SECONDS
            ratio = round(real_s / estimated_s, 2) if estimated_s > 0 else 0.0
            items.append({
                "lessonId": row.lesson_id,
                "lessonTitle": row.lesson_title,
                "estimatedTimeSeconds": estimated_s,
                "realTimeSeconds": real_s,
                "ratio": ratio,
                "classification": self._classify_reading(ratio),
                "completedAt": row.completed_at.isoformat() if row.completed_at else None,
            })
        return items

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
