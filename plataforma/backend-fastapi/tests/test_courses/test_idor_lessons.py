"""
SEC-011: Tests para IDOR en endpoint de lecciones.

Verifica que estudiantes no inscritos no puedan acceder al contenido del curso.
Admins e instructores pueden acceder sin inscripcion.
"""
from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, Module, Lesson
from app.models.progress import Enrollment
from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


async def _create_course_with_module(db: AsyncSession) -> tuple[Course, Module]:
    course = Course(
        slug="sec011-test",
        title="Curso SEC-011",
        description="Curso para test IDOR",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="Test Author",
        is_published=True,
        price=0.0,
    )
    db.add(course)
    await db.flush()

    module = Module(
        course_id=course.id,
        title="Modulo 1",
        description="Descripcion del modulo",
        duration=30,
        order=1,
        is_published=True,
    )
    db.add(module)
    await db.flush()
    await db.refresh(course)
    await db.refresh(module)
    return course, module


async def _create_user_with_token(db: AsyncSession, email: str, role: UserRole = UserRole.STUDENT) -> tuple[User, str]:
    user = User(email=email, password_hash=hash_password("Pass1234!"), name="Test", role=role)
    db.add(user)
    await db.flush()
    await db.refresh(user)

    ts = TokenService(redis=MagicMock())
    token = ts.create_access_token(user.id, user.email, user.role.value)
    return user, token


async def _enroll(db: AsyncSession, user_id: str, course_id: str) -> None:
    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.add(enrollment)
    await db.flush()


# ---------------------------------------------------------------------------
# SEC-011 IDOR checks
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_lessons_blocks_unenrolled_student(client: AsyncClient, db_session: AsyncSession) -> None:
    """Estudiante no inscrito recibe 403."""
    course, module = await _create_course_with_module(db_session)
    _, token = await _create_user_with_token(db_session, "idor_student@test.com", UserRole.STUDENT)

    resp = await client.get(
        f"/api/courses/{course.id}/modules/{module.id}/lessons",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_lessons_allows_enrolled_student(client: AsyncClient, db_session: AsyncSession) -> None:
    """Estudiante inscrito puede ver las lecciones (200)."""
    course, module = await _create_course_with_module(db_session)
    user, token = await _create_user_with_token(db_session, "enrolled_student@test.com", UserRole.STUDENT)
    await _enroll(db_session, user.id, course.id)

    resp = await client.get(
        f"/api/courses/{course.id}/modules/{module.id}/lessons",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_get_lessons_allows_admin_without_enrollment(client: AsyncClient, db_session: AsyncSession) -> None:
    """Admin puede ver lecciones sin estar inscrito."""
    course, module = await _create_course_with_module(db_session)
    _, token = await _create_user_with_token(db_session, "admin_idor@test.com", UserRole.ADMIN)

    resp = await client.get(
        f"/api/courses/{course.id}/modules/{module.id}/lessons",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_lessons_allows_instructor_without_enrollment(client: AsyncClient, db_session: AsyncSession) -> None:
    """Instructor puede ver lecciones sin estar inscrito."""
    course, module = await _create_course_with_module(db_session)
    _, token = await _create_user_with_token(db_session, "instructor_idor@test.com", UserRole.INSTRUCTOR)

    resp = await client.get(
        f"/api/courses/{course.id}/modules/{module.id}/lessons",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
