"""H-07: Labs deben fallar cerrado si el modulo no existe (404, no skip del enrollment check).
M-02: complete_lab_manual solo permitido para ADMIN e INSTRUCTOR.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Lab
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


async def _make_course_and_module(db: AsyncSession) -> tuple[Course, Module]:
    course = Course(slug=f"c-labs-{id(db)}", title="Curso Labs", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db.add(course)
    await db.flush()
    module = Module(course_id=course.id, title="Modulo Labs", description="Descripcion", duration=60, order=1)
    db.add(module)
    await db.flush()
    return course, module


async def _make_lab(db: AsyncSession, module_id: str, lab_type: str = "EXECUTABLE") -> Lab:
    lab = Lab(module_id=module_id, title="Lab Test", description="D", lab_type=lab_type, language="python")
    db.add(lab)
    await db.flush()
    return lab


async def _token_for(user: User, db: AsyncSession) -> str:
    ts = TokenService(db)
    return ts.create_access_token(user.id, user.email, user.role.value)


@pytest.mark.asyncio
async def test_list_labs_returns_404_when_module_not_found(client: AsyncClient, db_session: AsyncSession) -> None:
    """H-07: Si el modulo no existe, list_labs debe devolver 404 (no skip del enrollment check)."""
    user = await _make_user(db_session, "h07a@test.com")
    await db_session.commit()
    token = await _token_for(user, db_session)

    response = await client.get(
        "/api/labs/module/nonexistent-module-id",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404, f"Debe devolver 404 para modulo inexistente, got {response.status_code}"


@pytest.mark.asyncio
async def test_list_labs_student_without_enrollment_gets_403(client: AsyncClient, db_session: AsyncSession) -> None:
    """H-07: Student no inscrito con modulo real debe obtener 403."""
    course, module = await _make_course_and_module(db_session)
    await _make_lab(db_session, module.id)
    user = await _make_user(db_session, "h07b@test.com")
    await db_session.commit()
    token = await _token_for(user, db_session)

    response = await client.get(
        f"/api/labs/module/{module.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, f"Student sin inscripcion debe obtener 403, got {response.status_code}"


@pytest.mark.asyncio
async def test_list_labs_student_with_enrollment_gets_200(client: AsyncClient, db_session: AsyncSession) -> None:
    """H-07: Student inscrito con modulo real debe obtener 200."""
    course, module = await _make_course_and_module(db_session)
    await _make_lab(db_session, module.id)
    user = await _make_user(db_session, "h07c@test.com")
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    token = await _token_for(user, db_session)

    response = await client.get(
        f"/api/labs/module/{module.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, f"Student inscrito debe obtener 200, got {response.status_code}"


@pytest.mark.asyncio
async def test_complete_lab_manual_student_gets_403(client: AsyncClient, db_session: AsyncSession) -> None:
    """M-02: Student no puede auto-aprobar un lab DELIVERABLE via complete_lab_manual."""
    course, module = await _make_course_and_module(db_session)
    lab = await _make_lab(db_session, module.id, lab_type="DELIVERABLE")
    user = await _make_user(db_session, "m02a@test.com", UserRole.STUDENT)
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    token = await _token_for(user, db_session)

    response = await client.post(
        f"/api/labs/{lab.id}/complete",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, f"Student no debe poder auto-aprobar labs, got {response.status_code}"


@pytest.mark.asyncio
async def test_complete_lab_manual_instructor_gets_200(client: AsyncClient, db_session: AsyncSession) -> None:
    """M-02: Instructor puede marcar un lab DELIVERABLE como completado."""
    course, module = await _make_course_and_module(db_session)
    lab = await _make_lab(db_session, module.id, lab_type="DELIVERABLE")
    instructor = await _make_user(db_session, "m02b@test.com", UserRole.INSTRUCTOR)
    await db_session.commit()
    token = await _token_for(instructor, db_session)

    with patch("app.services.lab_service.LabService.submit", new_callable=AsyncMock) as mock_submit, \
         patch("app.services.lab_service.LabService.get_submissions", new_callable=AsyncMock) as mock_subs:
        mock_subs.return_value = []
        mock_sub = MagicMock()
        mock_sub.id = "sub-001"
        mock_sub.passed = True
        mock_submit.return_value = mock_sub

        response = await client.post(
            f"/api/labs/{lab.id}/complete",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, f"Instructor debe poder completar labs, got {response.status_code}"
