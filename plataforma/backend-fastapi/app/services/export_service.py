import csv
import io
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Lesson, Module
from app.models.gamification import Certificate
from app.models.progress import Enrollment, UserProgress
from app.models.user import User


class ExportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def export_enrollments_csv(self, course_id: str | None = None) -> str:
        query = (
            select(
                Enrollment.id,
                User.email,
                User.name,
                Course.title.label("course_title"),
                Course.slug,
                Enrollment.progress,
                Enrollment.enrolled_at,
                Enrollment.completed_at,
            )
            .join(User, Enrollment.user_id == User.id)
            .join(Course, Enrollment.course_id == Course.id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        if course_id:
            query = query.where(Enrollment.course_id == course_id)

        result = await self.db.execute(query)
        rows = result.all()

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "email", "nombre", "curso", "slug",
            "progreso_%", "fecha_inscripcion", "fecha_completado",
        ])
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "id": row.id,
                "email": row.email,
                "nombre": row.name or "",
                "curso": row.course_title,
                "slug": row.slug,
                "progreso_%": row.progress,
                "fecha_inscripcion": row.enrolled_at.isoformat() if row.enrolled_at else "",
                "fecha_completado": row.completed_at.isoformat() if row.completed_at else "",
            })
        return output.getvalue()

    async def export_progress_csv(self, course_id: str) -> str:
        query = (
            select(
                User.email,
                User.name,
                Module.title.label("module_title"),
                Module.order.label("module_order"),
                UserProgress.completed,
                UserProgress.progress,
                UserProgress.time_spent,
                UserProgress.completed_at,
            )
            .join(User, UserProgress.user_id == User.id)
            .join(Module, UserProgress.module_id == Module.id)
            .where(Module.course_id == course_id)
            .order_by(User.email, Module.order)
        )
        result = await self.db.execute(query)
        rows = result.all()

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "email", "nombre", "modulo_orden", "modulo",
            "completado", "progreso_%", "tiempo_segundos", "fecha_completado",
        ])
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "email": row.email,
                "nombre": row.name or "",
                "modulo_orden": row.module_order,
                "modulo": row.module_title,
                "completado": "si" if row.completed else "no",
                "progreso_%": row.progress,
                "tiempo_segundos": row.time_spent,
                "fecha_completado": row.completed_at.isoformat() if row.completed_at else "",
            })
        return output.getvalue()

    async def export_course_stats_csv(self) -> str:
        from sqlalchemy import func

        query = (
            select(
                Course.id,
                Course.title,
                Course.slug,
                Course.level,
                Course.is_published,
                func.count(Enrollment.id).label("total_enrollments"),
                func.avg(Enrollment.progress).label("avg_progress"),
                func.count(Certificate.id).label("certificates_issued"),
            )
            .outerjoin(Enrollment, Enrollment.course_id == Course.id)
            .outerjoin(Certificate, Certificate.course_id == Course.id)
            .group_by(Course.id)
            .order_by(func.count(Enrollment.id).desc())
        )
        result = await self.db.execute(query)
        rows = result.all()

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "titulo", "slug", "nivel", "publicado",
            "inscripciones", "progreso_promedio_%", "certificados",
        ])
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "id": row.id,
                "titulo": row.title,
                "slug": row.slug,
                "nivel": row.level,
                "publicado": "si" if row.is_published else "no",
                "inscripciones": row.total_enrollments,
                "progreso_promedio_%": round(row.avg_progress or 0, 2),
                "certificados": row.certificates_issued,
            })
        return output.getvalue()
