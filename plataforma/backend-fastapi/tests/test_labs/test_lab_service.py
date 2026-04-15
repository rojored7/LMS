import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.assessment import Lab
from app.models.course import Course, CourseLevel, Module
from app.services.lab_service import LabService


async def _create_module(db: AsyncSession) -> Module:
    course = Course(slug="lab-test-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db.add(course)
    await db.commit()
    await db.refresh(course)

    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=30)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return module


async def test_get_by_id_found(db_session: AsyncSession) -> None:
    module = await _create_module(db_session)
    lab = Lab(module_id=module.id, title="Lab 1", description="Test lab", language="python")
    db_session.add(lab)
    await db_session.commit()
    await db_session.refresh(lab)

    service = LabService(db_session)
    found = await service.get_by_id(lab.id)
    assert found.id == lab.id
    assert found.title == "Lab 1"


async def test_get_by_id_not_found(db_session: AsyncSession) -> None:
    service = LabService(db_session)
    with pytest.raises(NotFoundError, match="Laboratorio"):
        await service.get_by_id("nonexistent-id")


async def test_list_by_module(db_session: AsyncSession) -> None:
    module = await _create_module(db_session)
    lab1 = Lab(module_id=module.id, title="Lab A", description="D", language="python")
    lab2 = Lab(module_id=module.id, title="Lab B", description="D", language="bash")
    db_session.add_all([lab1, lab2])
    await db_session.commit()

    service = LabService(db_session)
    labs = await service.list_by_module(module.id)
    assert len(labs) == 2
    titles = {lab.title for lab in labs}
    assert titles == {"Lab A", "Lab B"}


async def test_list_by_module_empty(db_session: AsyncSession) -> None:
    module = await _create_module(db_session)
    service = LabService(db_session)
    labs = await service.list_by_module(module.id)
    assert labs == []


async def test_create_lab(db_session: AsyncSession) -> None:
    module = await _create_module(db_session)
    service = LabService(db_session)
    lab = await service.create(module.id, {"title": "New Lab", "description": "Desc", "language": "python"})
    assert lab.id is not None
    assert lab.title == "New Lab"
    assert lab.module_id == module.id


async def test_delete_lab(db_session: AsyncSession) -> None:
    module = await _create_module(db_session)
    lab = Lab(module_id=module.id, title="Delete Me", description="D", language="python")
    db_session.add(lab)
    await db_session.commit()
    await db_session.refresh(lab)
    lab_id = lab.id

    service = LabService(db_session)
    await service.delete(lab_id)

    with pytest.raises(NotFoundError):
        await service.get_by_id(lab_id)
