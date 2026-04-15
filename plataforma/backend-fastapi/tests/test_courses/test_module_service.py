"""Tests for ModuleService: get_by_id, list_by_course, create, update, delete."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.course import Course, CourseLevel
from app.services.module_service import ModuleService


async def _seed_course(db: AsyncSession) -> Course:
    course = Course(
        slug="mod-course",
        title="Curso Modulos",
        description="D",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="Author",
        is_published=True,
        price=0.0,
    )
    db.add(course)
    await db.flush()
    return course


@pytest.mark.asyncio
async def test_create_module(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ModuleService(db_session)
    module = await svc.create(course.id, {"order": 1, "title": "Modulo 1", "description": "Desc", "duration": 30, "is_published": False})
    assert module.id is not None
    assert module.title == "Modulo 1"
    assert module.course_id == course.id


@pytest.mark.asyncio
async def test_create_module_course_not_found(db_session: AsyncSession) -> None:
    svc = ModuleService(db_session)
    with pytest.raises(NotFoundError, match="Curso no encontrado"):
        await svc.create("fake-id", {"order": 1, "title": "M", "description": "D", "duration": 10, "is_published": False})


@pytest.mark.asyncio
async def test_get_by_id(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ModuleService(db_session)
    created = await svc.create(course.id, {"order": 1, "title": "M1", "description": "D", "duration": 10, "is_published": False})
    found = await svc.get_by_id(created.id)
    assert found.title == "M1"


@pytest.mark.asyncio
async def test_get_by_id_not_found(db_session: AsyncSession) -> None:
    svc = ModuleService(db_session)
    with pytest.raises(NotFoundError, match="Modulo no encontrado"):
        await svc.get_by_id("no-existe")


@pytest.mark.asyncio
async def test_list_by_course(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ModuleService(db_session)
    await svc.create(course.id, {"order": 2, "title": "M2", "description": "D2", "duration": 10, "is_published": False})
    await svc.create(course.id, {"order": 1, "title": "M1", "description": "D1", "duration": 10, "is_published": False})
    modules = await svc.list_by_course(course.id)
    assert len(modules) == 2
    assert modules[0].order < modules[1].order


@pytest.mark.asyncio
async def test_update_module(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ModuleService(db_session)
    m = await svc.create(course.id, {"order": 1, "title": "Old", "description": "D", "duration": 10, "is_published": False})
    updated = await svc.update(m.id, {"title": "New"})
    assert updated.title == "New"


@pytest.mark.asyncio
async def test_delete_module(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ModuleService(db_session)
    m = await svc.create(course.id, {"order": 1, "title": "Del", "description": "D", "duration": 10, "is_published": False})
    await svc.delete(m.id)
    with pytest.raises(NotFoundError):
        await svc.get_by_id(m.id)
