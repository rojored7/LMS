"""Tests para CRUD de areas y asignacion de area a usuario."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Area, User, UserRole
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


async def _create_area(db: AsyncSession, name: str = "Desarrollo", color: str = "#3b82f6") -> Area:
    area = Area(name=name, description="Descripcion", color=color)
    db.add(area)
    await db.commit()
    await db.refresh(area)
    return area


# ---------------------------------------------------------------------------
# Slice 1: CRUD de areas
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_areas_empty_for_admin(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    resp = await client.get("/api/admin/areas", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"] == []


@pytest.mark.asyncio
async def test_list_areas_forbidden_for_student(client: AsyncClient, db_session: AsyncSession):
    student = await _create_user(db_session, "student@test.com", UserRole.STUDENT)
    token = _token(student, db_session)
    resp = await client.get("/api/admin/areas", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_area(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    resp = await client.post(
        "/api/admin/areas",
        json={"name": "Ciberseguridad", "description": "Equipo de seguridad", "color": "#ef4444"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["name"] == "Ciberseguridad"
    assert body["data"]["color"] == "#ef4444"
    assert "id" in body["data"]


@pytest.mark.asyncio
async def test_create_area_duplicate_name_returns_409(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    await _create_area(db_session, name="Duplicado")
    resp = await client.post(
        "/api/admin/areas",
        json={"name": "Duplicado"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_area(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    area = await _create_area(db_session)
    resp = await client.put(
        f"/api/admin/areas/{area.id}",
        json={"description": "Descripcion actualizada"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["description"] == "Descripcion actualizada"
    assert body["data"]["name"] == "Desarrollo"  # sin cambio


@pytest.mark.asyncio
async def test_delete_area(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    area = await _create_area(db_session)
    resp = await client.delete(
        f"/api/admin/areas/{area.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    # Verificar que ya no existe
    resp2 = await client.get("/api/admin/areas", headers={"Authorization": f"Bearer {token}"})
    assert resp2.json()["data"] == []


@pytest.mark.asyncio
async def test_delete_area_not_found(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    token = _token(admin, db_session)
    resp = await client.delete(
        "/api/admin/areas/nonexistent",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Slice 2: asignacion de area a usuario + filtro
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_assign_area_to_user(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    student = await _create_user(db_session, "student@test.com", UserRole.STUDENT)
    area = await _create_area(db_session)
    token = _token(admin, db_session)
    resp = await client.put(
        f"/api/admin/users/{student.id}/area",
        json={"areaId": area.id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["areaId"] == area.id
    assert body["data"]["area"]["name"] == "Desarrollo"


@pytest.mark.asyncio
async def test_remove_area_from_user(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    student = await _create_user(db_session, "student@test.com", UserRole.STUDENT)
    area = await _create_area(db_session)
    student.area_id = area.id
    await db_session.commit()
    token = _token(admin, db_session)
    resp = await client.put(
        f"/api/admin/users/{student.id}/area",
        json={"areaId": None},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["areaId"] is None


@pytest.mark.asyncio
async def test_assign_nonexistent_area_returns_404(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    student = await _create_user(db_session, "student@test.com", UserRole.STUDENT)
    token = _token(admin, db_session)
    resp = await client.put(
        f"/api/admin/users/{student.id}/area",
        json={"areaId": "nonexistent"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_filter_users_by_area(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    s1 = await _create_user(db_session, "s1@test.com", UserRole.STUDENT)
    s2 = await _create_user(db_session, "s2@test.com", UserRole.STUDENT)
    area = await _create_area(db_session)
    s1.area_id = area.id
    await db_session.commit()
    token = _token(admin, db_session)
    resp = await client.get(
        f"/api/admin/users?area_id={area.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    ids = [u["id"] for u in data]
    assert s1.id in ids
    assert s2.id not in ids
    assert admin.id not in ids


@pytest.mark.asyncio
async def test_list_users_response_includes_area(client: AsyncClient, db_session: AsyncSession):
    admin = await _create_user(db_session, "admin@test.com", UserRole.ADMIN)
    student = await _create_user(db_session, "student@test.com", UserRole.STUDENT)
    area = await _create_area(db_session, name="QA", color="#22c55e")
    student.area_id = area.id
    await db_session.commit()
    token = _token(admin, db_session)
    resp = await client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    users = resp.json()["data"]
    student_data = next(u for u in users if u["id"] == student.id)
    assert student_data["area"] is not None
    assert student_data["area"]["name"] == "QA"
    assert student_data["area"]["color"] == "#22c55e"
