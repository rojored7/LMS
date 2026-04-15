"""Tests for LessonService: get_lesson, get_lesson_progress."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.course import Course, CourseLevel, Lesson, LessonType, Module
from app.models.user import User, UserRole
from app.services.lesson_service import LessonService
from app.utils.security import hash_password


async def _seed_lesson(db: AsyncSession) -> Lesson:
    course = Course(slug="lesson-c", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True, price=0.0)
    db.add(course)
    await db.flush()
    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=30, is_published=True)
    db.add(module)
    await db.flush()
    lesson = Lesson(module_id=module.id, order=1, title="Leccion 1", content="Contenido", type=LessonType.TEXT, estimated_time=15)
    db.add(lesson)
    await db.flush()
    return lesson


@pytest.mark.asyncio
async def test_get_lesson_success(db_session: AsyncSession) -> None:
    lesson = await _seed_lesson(db_session)
    svc = LessonService(db_session)
    found = await svc.get_lesson(lesson.id)
    assert found.title == "Leccion 1"


@pytest.mark.asyncio
async def test_get_lesson_not_found(db_session: AsyncSession) -> None:
    svc = LessonService(db_session)
    with pytest.raises(NotFoundError, match="Leccion no encontrada"):
        await svc.get_lesson("no-existe")


@pytest.mark.asyncio
async def test_get_lesson_progress_no_progress(db_session: AsyncSession) -> None:
    lesson = await _seed_lesson(db_session)
    user = User(email="lp@test.com", password_hash=hash_password("x"), name="LP", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    svc = LessonService(db_session)
    result = await svc.get_lesson_progress(lesson.id, user.id)
    assert result["lessonId"] == lesson.id
    assert result["completed"] is False
    assert result["progress"] == 0
    assert result["timeSpent"] == 0
