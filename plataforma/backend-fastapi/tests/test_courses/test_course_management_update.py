"""Tests for PUT /api/admin/courses/{course_id} endpoint (course update)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.course import Course, CourseLevel
from app.models.user import User, UserRole
from app.utils.security import hash_password
from app.services.token_service import TokenService


async def _create_course(
    db: AsyncSession,
    slug: str = "test-course",
    title: str = "Curso Original",
    author_id: str | None = None,
) -> Course:
    course = Course(
        slug=slug,
        title=title,
        description="Descripcion original",
        duration=60,
        level=CourseLevel.BEGINNER,
        author="Autor Test",
        is_published=True,
        price=0.0,
        author_id=author_id,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


async def _create_user_and_token(
    db: AsyncSession,
    email: str = "admin@test.com",
    role: UserRole = UserRole.ADMIN,
) -> tuple[User, str]:
    user = User(
        email=email,
        password_hash=hash_password("Pass1234!"),
        name="Test User",
        role=role,
    )
    db.add(user)
    await db.flush()

    redis_mock = MagicMock()
    ts = TokenService(redis=redis_mock)
    token = ts.create_access_token(user.id, user.email, user.role.value)
    return user, token


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_title_success(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """Admin puede actualizar el titulo de un curso y recibe 200."""
    mock_redis.get = AsyncMock(return_value=None)
    user, token = await _create_user_and_token(db_session, role=UserRole.ADMIN)
    course = await _create_course(db_session)

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Titulo Actualizado"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["title"] == "Titulo Actualizado"


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_returns_updated_data(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """La respuesta contiene todos los campos del curso actualizado."""
    mock_redis.get = AsyncMock(return_value=None)
    user, token = await _create_user_and_token(db_session, role=UserRole.ADMIN)
    course = await _create_course(db_session)

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Nuevo Titulo", "description": "Nueva descripcion"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["title"] == "Nuevo Titulo"
    assert body["data"]["description"] == "Nueva descripcion"
    assert body["data"]["slug"] == "test-course"
    assert body["data"]["id"] == course.id


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_partial_update(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """Enviar solo titulo no afecta otros campos como description."""
    mock_redis.get = AsyncMock(return_value=None)
    user, token = await _create_user_and_token(db_session, role=UserRole.ADMIN)
    course = await _create_course(db_session)

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Solo Titulo"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["title"] == "Solo Titulo"
    assert body["data"]["description"] == "Descripcion original"


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_not_found(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """Course ID inexistente retorna 404."""
    mock_redis.get = AsyncMock(return_value=None)
    user, token = await _create_user_and_token(db_session, role=UserRole.ADMIN)

    resp = await client.put(
        "/api/admin/courses/nonexistent-id",
        json={"title": "Titulo"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_course_unauthorized(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Sin token de auth recibe 401."""
    course = await _create_course(db_session)

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Sin Auth"},
    )

    assert resp.status_code == 401


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_instructor_not_owner(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """Instructor que no es owner del curso recibe 403."""
    mock_redis.get = AsyncMock(return_value=None)
    owner, _ = await _create_user_and_token(
        db_session, email="owner@test.com", role=UserRole.INSTRUCTOR
    )
    course = await _create_course(db_session, author_id=owner.id)

    other_instructor, other_token = await _create_user_and_token(
        db_session, email="other@test.com", role=UserRole.INSTRUCTOR
    )

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Intento de otro instructor"},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert resp.status_code == 403


@patch("app.middleware.auth.redis_client", new_callable=AsyncMock)
@pytest.mark.asyncio
async def test_update_course_instructor_owner_success(
    mock_redis: AsyncMock, client: AsyncClient, db_session: AsyncSession
) -> None:
    """Instructor owner del curso puede actualizarlo."""
    mock_redis.get = AsyncMock(return_value=None)
    owner, token = await _create_user_and_token(
        db_session, email="owner@test.com", role=UserRole.INSTRUCTOR
    )
    course = await _create_course(db_session, author_id=owner.id)

    resp = await client.put(
        f"/api/admin/courses/{course.id}",
        json={"title": "Actualizado por owner"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["title"] == "Actualizado por owner"
