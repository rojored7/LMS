"""M-01: list_attachments debe verificar enrollment antes de dar acceso.
Student no inscrito -> 403. Student inscrito -> 200. Admin/Instructor -> 200.
"""
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Lab
from app.models.content import Attachment
from app.models.course import Course, CourseLevel, Lesson, LessonType, Module
from app.models.progress import Enrollment
from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


async def _make_user(db: AsyncSession, email: str, role: UserRole = UserRole.STUDENT) -> User:
    user = User(email=email, password_hash=hash_password("Pass1!"), name="Test", role=role)
    db.add(user)
    await db.flush()
    return user


async def _make_course_module_lesson(db: AsyncSession) -> tuple[Course, Module, Lesson]:
    course = Course(
        slug=f"c-att-{id(db)}",
        title="Curso Att",
        description="D",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="A",
        is_published=True,
    )
    db.add(course)
    await db.flush()
    module = Module(
        course_id=course.id,
        title="Modulo Att",
        description="Desc",
        duration=60,
        order=1,
    )
    db.add(module)
    await db.flush()
    lesson = Lesson(
        module_id=module.id,
        title="Leccion Att",
        content="Contenido",
        type=LessonType.TEXT,
        order=1,
        estimated_time=10,
    )
    db.add(lesson)
    await db.flush()
    return course, module, lesson


async def _make_attachment(db: AsyncSession, lesson_id: str, uploader_id: str) -> Attachment:
    att = Attachment(
        lesson_id=lesson_id,
        original_filename="test.pdf",
        stored_filename="test-stored.pdf",
        file_path="/uploads/test-stored.pdf",
        file_size=1024,
        mime_type="application/pdf",
        uploaded_by=uploader_id,
    )
    db.add(att)
    await db.flush()
    return att


def _token_for(user: User, db: AsyncSession) -> str:
    ts = TokenService(db)
    return ts.create_access_token(user.id, user.email, user.role.value)


@pytest.mark.asyncio
async def test_list_attachments_student_without_enrollment_gets_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-01: Student no inscrito no debe poder ver adjuntos de una leccion."""
    course, module, lesson = await _make_course_module_lesson(db_session)
    instructor = await _make_user(db_session, "m01-inst@test.com", UserRole.INSTRUCTOR)
    await _make_attachment(db_session, lesson.id, instructor.id)
    student = await _make_user(db_session, "m01-student-no@test.com")
    await db_session.commit()
    token = _token_for(student, db_session)

    response = await client.get(
        f"/api/attachments/lesson/{lesson.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, (
        f"Student sin inscripcion debe obtener 403, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_attachments_student_with_enrollment_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-01: Student inscrito puede ver adjuntos de una leccion."""
    course, module, lesson = await _make_course_module_lesson(db_session)
    instructor = await _make_user(db_session, "m01-inst2@test.com", UserRole.INSTRUCTOR)
    await _make_attachment(db_session, lesson.id, instructor.id)
    student = await _make_user(db_session, "m01-student-yes@test.com")
    enrollment = Enrollment(user_id=student.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    token = _token_for(student, db_session)

    with patch("app.services.attachment_service.AttachmentService.list_for_lesson") as mock_list:
        mock_list.return_value = []
        response = await client.get(
            f"/api/attachments/lesson/{lesson.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Student inscrito debe obtener 200, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_attachments_admin_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-01: Admin puede ver adjuntos sin inscripcion."""
    course, module, lesson = await _make_course_module_lesson(db_session)
    admin = await _make_user(db_session, "m01-admin@test.com", UserRole.ADMIN)
    await db_session.commit()
    token = _token_for(admin, db_session)

    with patch("app.services.attachment_service.AttachmentService.list_for_lesson") as mock_list:
        mock_list.return_value = []
        response = await client.get(
            f"/api/attachments/lesson/{lesson.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200, (
        f"Admin debe obtener 200, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_list_attachments_lesson_not_found_gets_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-01: Leccion inexistente debe devolver 404 (fail-closed)."""
    student = await _make_user(db_session, "m01-404@test.com")
    await db_session.commit()
    token = _token_for(student, db_session)

    response = await client.get(
        "/api/attachments/lesson/nonexistent-lesson-id",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404, (
        f"Leccion inexistente debe devolver 404, got {response.status_code}"
    )
