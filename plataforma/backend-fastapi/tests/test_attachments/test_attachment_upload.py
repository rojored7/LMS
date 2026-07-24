"""T-01 a T-04: POST /api/attachments/lesson/{id} — upload de imagenes para lecciones."""
import os
import tempfile
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, Lesson, LessonType, Module
from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password

# Firma completa de 8 bytes del formato PNG
# _detect_mime del backend verifica los primeros 4 bytes: b"\x89PNG"
_PNG_BYTES = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + b"\x00" * 100

# Magic bytes de EXE: MZ — no matchea ningun entry de _MAGIC_BYTES ni extension permitida
_EXE_BYTES = b"MZ\x90\x00" + b"\x00" * 100


async def _make_user(db: AsyncSession, email: str, role: UserRole = UserRole.STUDENT) -> User:
    user = User(email=email, password_hash=hash_password("Pass1!"), name="Test", role=role)
    db.add(user)
    await db.flush()
    return user


async def _make_lesson(db: AsyncSession) -> Lesson:
    course = Course(
        slug=f"c-img-{id(db)}",
        title="Curso Img",
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
        title="Modulo",
        description="Desc",
        duration=60,
        order=1,
    )
    db.add(module)
    await db.flush()
    lesson = Lesson(
        module_id=module.id,
        title="Leccion",
        content="Contenido",
        type=LessonType.TEXT,
        order=1,
        estimated_time=10,
    )
    db.add(lesson)
    await db.flush()
    return lesson


def _token_for(user: User, db: AsyncSession) -> str:
    return TokenService(db).create_access_token(user.id, user.email, user.role.value)


@pytest.mark.asyncio
async def test_upload_png_instructor_returns_download_url(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """T-01: Instructor sube PNG valido -> 200 con downloadUrl."""
    instructor = await _make_user(db_session, "t01-inst@test.com", UserRole.INSTRUCTOR)
    lesson = await _make_lesson(db_session)
    await db_session.commit()
    token = _token_for(instructor, db_session)

    with tempfile.TemporaryDirectory() as tmpdir:
        with patch.dict(os.environ, {"UPLOADS_DIR": tmpdir}):
            response = await client.post(
                f"/api/attachments/lesson/{lesson.id}",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("imagen.png", _PNG_BYTES, "image/png")},
            )

    assert response.status_code == 200, f"Esperado 200, got {response.status_code}: {response.text}"
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "downloadUrl" in data
    assert data["downloadUrl"].startswith("/api/uploads/lessons/")
    assert data["mimeType"] == "image/png"


@pytest.mark.asyncio
async def test_upload_invalid_mime_rejected(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """T-02: Archivo EXE con magic bytes MZ debe ser rechazado con 400."""
    instructor = await _make_user(db_session, "t02-inst@test.com", UserRole.INSTRUCTOR)
    lesson = await _make_lesson(db_session)
    await db_session.commit()
    token = _token_for(instructor, db_session)

    with tempfile.TemporaryDirectory() as tmpdir:
        with patch.dict(os.environ, {"UPLOADS_DIR": tmpdir}):
            response = await client.post(
                f"/api/attachments/lesson/{lesson.id}",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("malware.exe", _EXE_BYTES, "application/octet-stream")},
            )

    assert response.status_code == 400, f"EXE debe ser rechazado con 400, got {response.status_code}"


@pytest.mark.asyncio
async def test_upload_lesson_not_found(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """T-03: Upload a leccion inexistente devuelve 404."""
    instructor = await _make_user(db_session, "t03-inst@test.com", UserRole.INSTRUCTOR)
    await db_session.commit()
    token = _token_for(instructor, db_session)

    with tempfile.TemporaryDirectory() as tmpdir:
        with patch.dict(os.environ, {"UPLOADS_DIR": tmpdir}):
            response = await client.post(
                "/api/attachments/lesson/leccion-inexistente-xyz",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("imagen.png", _PNG_BYTES, "image/png")},
            )

    assert response.status_code in (400, 404), (
        f"Leccion inexistente debe devolver 400 o 404, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_upload_student_forbidden(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """T-04: STUDENT sin Permission.ATTACHMENT_MANAGE recibe 403."""
    student = await _make_user(db_session, "t04-stu@test.com", UserRole.STUDENT)
    lesson = await _make_lesson(db_session)
    await db_session.commit()
    token = _token_for(student, db_session)

    with tempfile.TemporaryDirectory() as tmpdir:
        with patch.dict(os.environ, {"UPLOADS_DIR": tmpdir}):
            response = await client.post(
                f"/api/attachments/lesson/{lesson.id}",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("imagen.png", _PNG_BYTES, "image/png")},
            )

    assert response.status_code == 403, f"Student debe recibir 403, got {response.status_code}"
