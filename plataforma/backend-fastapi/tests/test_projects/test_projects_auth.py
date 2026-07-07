"""CR-02: Rutas de proyectos sin autenticacion.
list_projects y get_project deben requerir auth + enrollment check para students.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, Module
from app.models.progress import Enrollment
from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


async def _make_user(db: AsyncSession, email: str, role: UserRole = UserRole.STUDENT) -> User:
    user = User(email=email, password_hash=hash_password("Pass1!"), name="Test", role=role)
    db.add(user)
    await db.flush()
    return user


async def _make_course(db: AsyncSession) -> Course:
    course = Course(
        slug=f"c-proj-{id(db)}",
        title="Curso Proyectos",
        description="D",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="A",
        is_published=True,
    )
    db.add(course)
    await db.flush()
    return course


def _token_for(user: User, db: AsyncSession) -> str:
    ts = TokenService(db)
    return ts.create_access_token(user.id, user.email, user.role.value)


@pytest.mark.asyncio
async def test_list_projects_unauthenticated_gets_401(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: GET /api/projects/course/{id} sin token debe devolver 401."""
    course = await _make_course(db_session)
    await db_session.commit()

    response = await client.get(f"/api/projects/course/{course.id}")
    assert response.status_code == 401, (
        f"Sin autenticacion debe devolver 401, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_projects_student_without_enrollment_gets_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: Student no inscrito no puede ver proyectos del curso."""
    course = await _make_course(db_session)
    student = await _make_user(db_session, "cr02-no-enroll@test.com")
    await db_session.commit()
    token = _token_for(student, db_session)

    response = await client.get(
        f"/api/projects/course/{course.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, (
        f"Student sin inscripcion debe obtener 403, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_projects_student_with_enrollment_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: Student inscrito puede ver proyectos del curso."""
    course = await _make_course(db_session)
    student = await _make_user(db_session, "cr02-enrolled@test.com")
    enrollment = Enrollment(user_id=student.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    token = _token_for(student, db_session)

    with patch("app.services.project_service.ProjectService.list_by_course") as mock_list:
        mock_list.return_value = []
        response = await client.get(
            f"/api/projects/course/{course.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Student inscrito debe obtener 200, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_projects_admin_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: Admin puede ver proyectos sin estar inscrito."""
    course = await _make_course(db_session)
    admin = await _make_user(db_session, "cr02-admin@test.com", UserRole.ADMIN)
    await db_session.commit()
    token = _token_for(admin, db_session)

    with patch("app.services.project_service.ProjectService.list_by_course") as mock_list:
        mock_list.return_value = []
        response = await client.get(
            f"/api/projects/course/{course.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Admin debe obtener 200, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_get_project_unauthenticated_gets_401(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: GET /api/projects/{id} sin token debe devolver 401."""
    response = await client.get("/api/projects/any-project-id")
    assert response.status_code == 401, (
        f"Sin autenticacion debe devolver 401, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_get_project_student_without_enrollment_gets_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: Student no inscrito no puede ver un proyecto especifico."""
    course = await _make_course(db_session)
    student = await _make_user(db_session, "cr02-get-no@test.com")
    await db_session.commit()
    token = _token_for(student, db_session)

    mock_project = MagicMock()
    mock_project.id = "proj-001"
    mock_project.title = "Proyecto Test"
    mock_project.description = "D"
    mock_project.requirements = None
    mock_project.rubric = None
    mock_project.course_id = course.id

    with patch("app.services.project_service.ProjectService.get_by_id", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_project
        response = await client.get(
            "/api/projects/proj-001",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 403, (
        f"Student sin inscripcion debe obtener 403, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_get_project_instructor_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """CR-02: Instructor puede ver un proyecto sin estar inscrito."""
    course = await _make_course(db_session)
    instructor = await _make_user(db_session, "cr02-inst@test.com", UserRole.INSTRUCTOR)
    await db_session.commit()
    token = _token_for(instructor, db_session)

    mock_project = MagicMock()
    mock_project.id = "proj-002"
    mock_project.title = "Proyecto Test"
    mock_project.description = "D"
    mock_project.requirements = None
    mock_project.rubric = None
    mock_project.course_id = course.id

    with patch("app.services.project_service.ProjectService.get_by_id", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_project
        response = await client.get(
            "/api/projects/proj-002",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Instructor debe obtener 200, got {response.status_code}"
    )
