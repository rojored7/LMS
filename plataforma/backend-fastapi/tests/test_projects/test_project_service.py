"""Tests for ProjectService: get_by_id, create, list_by_course, submit."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.course import Course, CourseLevel
from app.models.user import User, UserRole
from app.services.project_service import ProjectService
from app.utils.security import hash_password


async def _seed_course(db: AsyncSession) -> Course:
    course = Course(
        slug="proj-course",
        title="Curso para proyectos",
        description="Desc",
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
async def test_create_project(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ProjectService(db_session)

    project = await svc.create(
        course_id=course.id,
        data={"title": "Proyecto Final", "description": "Descripcion del proyecto", "requirements": {}, "rubric": {}},
    )

    assert project.id is not None
    assert project.title == "Proyecto Final"
    assert project.course_id == course.id


@pytest.mark.asyncio
async def test_get_by_id_success(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ProjectService(db_session)
    created = await svc.create(
        course_id=course.id,
        data={"title": "P1", "description": "D1", "requirements": {}, "rubric": {}},
    )

    found = await svc.get_by_id(created.id)
    assert found.id == created.id
    assert found.title == "P1"


@pytest.mark.asyncio
async def test_get_by_id_not_found(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    with pytest.raises(NotFoundError, match="Proyecto no encontrado"):
        await svc.get_by_id("nonexistent-id")


@pytest.mark.asyncio
async def test_list_by_course(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ProjectService(db_session)
    await svc.create(course_id=course.id, data={"title": "PA", "description": "DA", "requirements": {}, "rubric": {}})
    await svc.create(course_id=course.id, data={"title": "PB", "description": "DB", "requirements": {}, "rubric": {}})

    projects = await svc.list_by_course(course.id)
    assert len(projects) == 2
    titles = {p.title for p in projects}
    assert titles == {"PA", "PB"}


@pytest.mark.asyncio
async def test_submit_project(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    user = User(email="sub@test.com", password_hash=hash_password("x"), name="Sub", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    svc = ProjectService(db_session)
    project = await svc.create(
        course_id=course.id,
        data={"title": "P Submit", "description": "D", "requirements": {}, "rubric": {}},
    )

    submission = await svc.submit(project.id, user.id, content="Mi entrega")
    assert submission.project_id == project.id
    assert submission.user_id == user.id
    assert submission.content == "Mi entrega"
    assert submission.status.value == "PENDING"


@pytest.mark.asyncio
async def test_update_project(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ProjectService(db_session)
    project = await svc.create(
        course_id=course.id,
        data={"title": "Original", "description": "D", "requirements": {}, "rubric": {}},
    )

    updated = await svc.update(project.id, {"title": "Modificado"})
    assert updated.title == "Modificado"


@pytest.mark.asyncio
async def test_delete_project(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    svc = ProjectService(db_session)
    project = await svc.create(
        course_id=course.id,
        data={"title": "Borrar", "description": "D", "requirements": {}, "rubric": {}},
    )

    await svc.delete(project.id)
    with pytest.raises(NotFoundError):
        await svc.get_by_id(project.id)


@pytest.mark.asyncio
async def test_get_submission_not_found(db_session: AsyncSession) -> None:
    svc = ProjectService(db_session)
    with pytest.raises(NotFoundError, match="Entrega no encontrada"):
        await svc.get_submission("no-existe")


@pytest.mark.asyncio
async def test_list_submissions_by_user(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session)
    user = User(email="lsub@test.com", password_hash=hash_password("x"), name="LS", role=UserRole.STUDENT)
    db_session.add(user)
    await db_session.flush()

    svc = ProjectService(db_session)
    project = await svc.create(
        course_id=course.id,
        data={"title": "PL", "description": "D", "requirements": {}, "rubric": {}},
    )
    await svc.submit(project.id, user.id, content="Entrega 1")

    subs = await svc.list_submissions(user_id=user.id)
    assert len(subs) == 1
    assert subs[0].user_id == user.id
