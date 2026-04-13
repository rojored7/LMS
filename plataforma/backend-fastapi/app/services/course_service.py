import math
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.course import Course, CourseLevel, Module, Lesson
from app.models.progress import Enrollment

logger = structlog.get_logger()


class CourseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_published_courses(self, page: int = 1, limit: int = 10, level: str | None = None, search: str | None = None) -> tuple[list[Course], int]:
        query = select(Course).where(Course.is_published == True)  # noqa: E712
        count_query = select(func.count()).select_from(Course).where(Course.is_published == True)  # noqa: E712
        if level:
            query = query.where(Course.level == level)
            count_query = count_query.where(Course.level == level)
        if search:
            query = query.where(Course.title.ilike(f"%{search}%"))
            count_query = count_query.where(Course.title.ilike(f"%{search}%"))
        total = (await self.db.execute(count_query)).scalar() or 0
        offset = (page - 1) * limit
        result = await self.db.execute(query.offset(offset).limit(limit).order_by(Course.created_at.desc()))
        return list(result.scalars().all()), total

    async def get_course_by_id_or_slug(self, id_or_slug: str) -> Course:
        result = await self.db.execute(select(Course).where((Course.id == id_or_slug) | (Course.slug == id_or_slug)))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        return course

    async def create_course(self, slug: str, title: str, description: str, duration: int, level: str, author: str, tags: list[str] | None = None, thumbnail: str | None = None, price: float = 0.0) -> Course:
        existing = await self.db.execute(select(Course).where(Course.slug == slug))
        if existing.scalar_one_or_none():
            raise ConflictError(f"Ya existe un curso con slug '{slug}'")
        course = Course(slug=slug, title=title, description=description, duration=duration, level=CourseLevel(level), author=author, tags=tags, thumbnail=thumbnail, price=price)
        self.db.add(course)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def update_course(self, course_id: str, **kwargs: object) -> Course:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        updatable = {"title", "description", "duration", "level", "tags", "thumbnail", "price", "is_published"}
        for key, value in kwargs.items():
            if value is not None and key in updatable and hasattr(course, key):
                if key == "level":
                    value = CourseLevel(value)
                setattr(course, key, value)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def delete_course(self, course_id: str) -> None:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Curso no encontrado")
        await self.db.delete(course)
        await self.db.flush()

    async def enroll_user(self, user_id: str, course_id: str) -> tuple[Enrollment, bool]:
        course = await self.db.execute(select(Course).where(Course.id == course_id, Course.is_published == True))  # noqa: E712
        if course.scalar_one_or_none() is None:
            raise NotFoundError("Curso no encontrado o no publicado")
        existing = await self.db.execute(select(Enrollment).options(selectinload(Enrollment.course)).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
        enrollment = existing.scalar_one_or_none()
        if enrollment is not None:
            return enrollment, False
        enrollment = Enrollment(user_id=user_id, course_id=course_id)
        self.db.add(enrollment)
        await self.db.flush()
        result = await self.db.execute(select(Enrollment).options(selectinload(Enrollment.course)).where(Enrollment.id == enrollment.id))
        enrollment = result.scalar_one()
        return enrollment, True

    async def is_user_enrolled(self, user_id: str, course_id: str) -> bool:
        result = await self.db.execute(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
        return result.scalar_one_or_none() is not None

    async def unenroll_user(self, user_id: str, course_id: str) -> None:
        result = await self.db.execute(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
        enrollment = result.scalar_one_or_none()
        if enrollment is None:
            raise NotFoundError("Inscripcion no encontrada")
        await self.db.delete(enrollment)
        await self.db.flush()

    async def delete_enrollment_by_id(self, enrollment_id: str) -> None:
        result = await self.db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        enrollment = result.scalar_one_or_none()
        if enrollment is None:
            raise NotFoundError("Inscripcion no encontrada")
        await self.db.delete(enrollment)
        await self.db.flush()

    async def get_user_enrollments(self, user_id: str) -> list[Enrollment]:
        result = await self.db.execute(select(Enrollment).options(selectinload(Enrollment.course)).where(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc()))
        return list(result.scalars().all())

    async def get_course_modules(self, course_id_or_slug: str) -> list[Module]:
        course = await self.db.execute(select(Course).where((Course.id == course_id_or_slug) | (Course.slug == course_id_or_slug)))
        course_obj = course.scalar_one_or_none()
        if course_obj is None:
            raise NotFoundError("Curso no encontrado")
        result = await self.db.execute(select(Module).options(selectinload(Module.lessons), selectinload(Module.quizzes), selectinload(Module.labs)).where(Module.course_id == course_obj.id).order_by(Module.order))
        return list(result.scalars().all())

    async def get_module_lessons(self, module_id: str, course_id: str | None = None) -> list[Lesson]:
        if course_id:
            module_check = await self.db.execute(select(Module).where(Module.id == module_id, Module.course_id == course_id))
            if module_check.scalar_one_or_none() is None:
                raise NotFoundError("Modulo no pertenece al curso especificado")
        result = await self.db.execute(select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order))
        return list(result.scalars().all())
