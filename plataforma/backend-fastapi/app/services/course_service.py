import re

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.course import Course, Module
from app.models.progress import Enrollment

logger = structlog.get_logger()


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug


class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, course_id: str, load_modules: bool = False) -> Course:
        query = select(Course).where(Course.id == course_id)
        if load_modules:
            query = query.options(selectinload(Course.modules).selectinload(Module.lessons))
        result = await self.db.execute(query)
        course = result.scalar_one_or_none()
        if not course:
            raise NotFoundError("Curso no encontrado")
        return course

    async def get_by_slug(self, slug: str, load_modules: bool = False) -> Course:
        query = select(Course).where(Course.slug == slug)
        if load_modules:
            query = query.options(selectinload(Course.modules).selectinload(Module.lessons))
        result = await self.db.execute(query)
        course = result.scalar_one_or_none()
        if not course:
            raise NotFoundError("Curso no encontrado")
        return course

    async def get_by_id_or_slug(self, id_or_slug: str, load_modules: bool = False) -> Course:
        query = select(Course).where((Course.id == id_or_slug) | (Course.slug == id_or_slug))
        if load_modules:
            query = query.options(selectinload(Course.modules).selectinload(Module.lessons))
        result = await self.db.execute(query)
        course = result.scalar_one_or_none()
        if not course:
            raise NotFoundError("Curso no encontrado")
        return course

    async def list_courses(
        self,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        level: str | None = None,
        published_only: bool = True,
        user_id: str | None = None,
    ) -> dict:
        query = select(Course)
        count_query = select(func.count()).select_from(Course)

        if published_only:
            query = query.where(Course.published.is_(True))
            count_query = count_query.where(Course.published.is_(True))

        if search:
            pattern = f"%{search}%"
            query = query.where((Course.title.ilike(pattern)) | (Course.description.ilike(pattern)))
            count_query = count_query.where((Course.title.ilike(pattern)) | (Course.description.ilike(pattern)))

        if level:
            query = query.where(Course.level == level)
            count_query = count_query.where(Course.level == level)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * limit
        query = query.options(selectinload(Course.modules)).order_by(Course.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        courses = list(result.scalars().unique().all())

        enrolled_ids: set[str] = set()
        if user_id:
            enroll_result = await self.db.execute(select(Enrollment.course_id).where(Enrollment.user_id == user_id))
            enrolled_ids = {row[0] for row in enroll_result.all()}

        course_list = []
        for c in courses:
            enroll_count_result = await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.course_id == c.id)
            )
            enrollment_count = enroll_count_result.scalar() or 0
            course_list.append({
                "course": c,
                "enrollment_count": enrollment_count,
                "is_enrolled": c.id in enrolled_ids,
                "module_count": len(c.modules),
            })

        return {
            "courses": course_list,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if total else 0,
        }

    async def create(self, data: dict) -> Course:
        if not data.get("slug"):
            data["slug"] = _slugify(data["title"])

        existing = await self.db.execute(select(Course).where(Course.slug == data["slug"]))
        if existing.scalar_one_or_none():
            raise ConflictError("Ya existe un curso con ese slug")

        course = Course(**data)
        self.db.add(course)
        await self.db.flush()
        logger.info("course_created", course_id=course.id, title=course.title)
        return course

    async def update(self, course_id: str, data: dict) -> Course:
        course = await self.get_by_id(course_id)

        if "slug" in data and data["slug"] and data["slug"] != course.slug:
            existing = await self.db.execute(select(Course).where(Course.slug == data["slug"], Course.id != course_id))
            if existing.scalar_one_or_none():
                raise ConflictError("Ya existe un curso con ese slug")

        for key, value in data.items():
            if value is not None and hasattr(course, key):
                setattr(course, key, value)
        await self.db.flush()
        return course

    async def delete(self, course_id: str) -> None:
        course = await self.get_by_id(course_id)
        await self.db.delete(course)
        await self.db.flush()
        logger.info("course_deleted", course_id=course_id)

    async def is_user_enrolled(self, user_id: str, course_id: str) -> bool:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        return result.scalar_one_or_none() is not None

    async def enroll_user(self, user_id: str, course_id: str) -> Enrollment:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        course = await self.get_by_id(course_id)
        enrollment = Enrollment(user_id=user_id, course_id=course.id)
        self.db.add(enrollment)
        await self.db.flush()
        logger.info("user_enrolled", user_id=user_id, course_id=course_id)
        return enrollment

    async def get_enrolled_courses(self, user_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id).options(
                selectinload(Enrollment.course).selectinload(Course.modules)
            )
        )
        enrollments = list(result.scalars().all())
        courses = []
        for enrollment in enrollments:
            courses.append({
                "course": enrollment.course,
                "enrollment": enrollment,
                "enrollment_count": 0,
                "is_enrolled": True,
                "module_count": len(enrollment.course.modules) if enrollment.course.modules else 0,
            })
        return courses

    async def get_enrollment_count(self, course_id: str) -> int:
        result = await self.db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course_id))
        return result.scalar() or 0
