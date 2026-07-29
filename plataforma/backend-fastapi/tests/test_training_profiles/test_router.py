"""Tests para el router de training_profiles.
Cubre: CRUD existente + 2 nuevos endpoints PATCH + response con cursos."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, CourseProfile
from app.models.user import TrainingProfile, User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_user(db: AsyncSession, email: str, role: UserRole) -> User:
    user = User(email=email, password_hash=hash_password("Test1234!"), name="Test", role=role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def _token(user: User, db: AsyncSession) -> str:
    return TokenService(db).create_access_token(user.id, user.email, user.role.value)


async def _create_profile(db: AsyncSession, slug: str = "test-p") -> TrainingProfile:
    profile = TrainingProfile(name="Test Profile", slug=slug, description="Desc")
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def _create_course(db: AsyncSession, slug: str = "test-c") -> Course:
    course = Course(
        title="Test Course",
        slug=slug,
        description="Desc",
        duration=60,
        author="Test Author",
        level=CourseLevel.BEGINNER,
        is_published=True,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def _add_course_to_profile(
    db: AsyncSession, profile_id: str, course_id: str, order: int = 0
) -> CourseProfile:
    cp = CourseProfile(profile_id=profile_id, course_id=course_id, order=order, required=False)
    db.add(cp)
    await db.commit()
    await db.refresh(cp)
    return cp


# ---------------------------------------------------------------------------
# GET /api/training-profiles — retorna cursos con order y required
# ---------------------------------------------------------------------------

async def test_list_profiles_retorna_cursos_con_order_y_required(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    profile = await _create_profile(db_session, slug="ruta-1")
    course = await _create_course(db_session, slug="curso-1")
    await _add_course_to_profile(db_session, profile.id, course.id, order=3)

    resp = await client.get("/api/training-profiles")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    profiles = body["data"]
    assert len(profiles) == 1
    courses = profiles[0]["courses"]
    assert len(courses) == 1
    assert courses[0]["order"] == 3
    assert courses[0]["required"] is False
    assert "title" in courses[0]
    assert "id" in courses[0]


async def test_list_profiles_vacio(client: AsyncClient, db_session: AsyncSession) -> None:
    resp = await client.get("/api/training-profiles")
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# ---------------------------------------------------------------------------
# PATCH /{profile_id}/courses/{course_id} — actualizar order y required
# ---------------------------------------------------------------------------

async def test_update_course_in_profile_actualiza_order(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin = await _create_user(db_session, "admin-patch@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    profile = await _create_profile(db_session, slug="ruta-patch")
    course = await _create_course(db_session, slug="curso-patch")
    await _add_course_to_profile(db_session, profile.id, course.id, order=0)

    resp = await client.patch(
        f"/api/training-profiles/{profile.id}/courses/{course.id}",
        json={"order": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["order"] == 5


async def test_update_course_in_profile_actualiza_required(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin = await _create_user(db_session, "admin-req@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    profile = await _create_profile(db_session, slug="ruta-req")
    course = await _create_course(db_session, slug="curso-req")
    await _add_course_to_profile(db_session, profile.id, course.id, order=0)

    resp = await client.patch(
        f"/api/training-profiles/{profile.id}/courses/{course.id}",
        json={"required": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["required"] is True


async def test_update_course_in_profile_requiere_admin(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    student = await _create_user(db_session, "student-patch@t.com", UserRole.STUDENT)
    token = _token(student, db_session)

    resp = await client.patch(
        "/api/training-profiles/fake-id/courses/fake-course",
        json={"order": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


async def test_update_course_in_profile_no_encontrado(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin = await _create_user(db_session, "admin-404@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    profile = await _create_profile(db_session, slug="ruta-404")

    resp = await client.patch(
        f"/api/training-profiles/{profile.id}/courses/nonexistent-course",
        json={"order": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /{profile_id}/courses/reorder — reordenar en bulk
# ---------------------------------------------------------------------------

async def test_reorder_courses_actualiza_ordenes(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    admin = await _create_user(db_session, "admin-reorder@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    profile = await _create_profile(db_session, slug="ruta-reorder")
    c1 = await _create_course(db_session, slug="c-reorder-1")
    c2 = await _create_course(db_session, slug="c-reorder-2")
    await _add_course_to_profile(db_session, profile.id, c1.id, order=0)
    await _add_course_to_profile(db_session, profile.id, c2.id, order=1)

    resp = await client.patch(
        f"/api/training-profiles/{profile.id}/courses/reorder",
        json={
            "courses": [
                {"course_id": c2.id, "order": 0},
                {"course_id": c1.id, "order": 1},
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


async def test_reorder_courses_requiere_admin(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    student = await _create_user(db_session, "student-reorder@t.com", UserRole.STUDENT)
    token = _token(student, db_session)

    resp = await client.patch(
        "/api/training-profiles/fake-id/courses/reorder",
        json={"courses": []},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Tests de los endpoints existentes (smoke tests para no regresar)
# ---------------------------------------------------------------------------

async def test_create_profile(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _create_user(db_session, "admin-create@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)

    resp = await client.post(
        "/api/training-profiles",
        json={"name": "Nuevo", "slug": "nuevo", "description": "Desc", "icon": "shield", "color": "#3b82f6"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["name"] == "Nuevo"
    assert data["icon"] == "shield"
    assert data["color"] == "#3b82f6"


async def test_delete_profile(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _create_user(db_session, "admin-del@t.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    profile = await _create_profile(db_session, slug="para-borrar")

    resp = await client.delete(
        f"/api/training-profiles/{profile.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
