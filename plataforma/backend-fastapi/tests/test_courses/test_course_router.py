"""Tests for course router endpoints via httpx AsyncClient."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel
from app.models.user import User, UserRole
from app.utils.security import hash_password
from app.services.token_service import TokenService
from app.config import get_settings

settings = get_settings()


async def _create_published_course(db: AsyncSession, slug: str = "test-course", title: str = "Test Course") -> Course:
    course = Course(
        slug=slug,
        title=title,
        description="Descripcion del curso de prueba",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="Test Author",
        is_published=True,
        price=0.0,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


async def _create_user_and_token(db: AsyncSession, email: str = "student@test.com", role: UserRole = UserRole.STUDENT) -> tuple[User, str]:
    user = User(email=email, password_hash=hash_password("Pass1234!"), name="Test Student", role=role)
    db.add(user)
    await db.flush()

    from unittest.mock import MagicMock
    redis_mock = MagicMock()
    ts = TokenService(redis=redis_mock)
    token = ts.create_access_token(user.id, user.email, user.role.value)
    return user, token


@pytest.mark.asyncio
async def test_list_courses_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/courses")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"] == []
    assert body["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_list_courses_returns_published(client: AsyncClient, db_session: AsyncSession) -> None:
    await _create_published_course(db_session, slug="pub-1", title="Curso Publicado")
    unpub = Course(
        slug="unpub-1",
        title="Curso No Publicado",
        description="No publicado",
        duration=30,
        level=CourseLevel.INTERMEDIATE,
        author="Author",
        is_published=False,
        price=0.0,
    )
    db_session.add(unpub)
    await db_session.flush()

    resp = await client.get("/api/courses")
    assert resp.status_code == 200
    body = resp.json()
    assert body["meta"]["total"] == 1
    assert len(body["data"]) == 1
    assert body["data"][0]["slug"] == "pub-1"


@pytest.mark.asyncio
async def test_get_course_by_slug(client: AsyncClient, db_session: AsyncSession) -> None:
    course = await _create_published_course(db_session, slug="mi-curso", title="Mi Curso")

    resp = await client.get(f"/api/courses/{course.slug}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["slug"] == "mi-curso"
    assert body["data"]["title"] == "Mi Curso"
    assert body["data"]["isEnrolled"] is False


@pytest.mark.asyncio
async def test_get_course_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/courses/nonexistent-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_courses_with_search(client: AsyncClient, db_session: AsyncSession) -> None:
    await _create_published_course(db_session, slug="seguridad-web", title="Seguridad Web Avanzada")
    await _create_published_course(db_session, slug="redes-basico", title="Redes Basicas")

    resp = await client.get("/api/courses", params={"search": "Seguridad"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["meta"]["total"] == 1
    assert body["data"][0]["slug"] == "seguridad-web"


@pytest.mark.asyncio
async def test_enroll_requires_auth(client: AsyncClient, db_session: AsyncSession) -> None:
    course = await _create_published_course(db_session)
    resp = await client.post(f"/api/courses/{course.id}/enroll")
    assert resp.status_code == 401
