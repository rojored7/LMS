"""Slice 4: tests de endpoints LDAP en admin router."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


async def _make_admin(db: AsyncSession) -> User:
    user = User(
        email="adminldap@test.com",
        password_hash=hash_password("Pass1!"),
        name="Admin LDAP",
        role=UserRole.ADMIN,
    )
    db.add(user)
    await db.flush()
    return user


def _token(user: User, db: AsyncSession) -> str:
    return TokenService(db).create_access_token(user.id, user.email, user.role.value)


DEFAULT_CONFIG = {
    "server_url": "",
    "use_ssl": False,
    "timeout": 10,
    "bind_dn": "",
    "bind_password": "",
    "base_dn": "",
    "search_filter": "(sAMAccountName={username})",
    "email_attr": "mail",
    "name_attr": "cn",
    "group_attr": "memberOf",
    "role_mapping": "{}",
    "updated_at": None,
}


@pytest.mark.asyncio
async def test_get_ldap_config_requires_admin(client: AsyncClient) -> None:
    response = await client.get("/api/admin/ldap/config")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_ldap_config_returns_defaults(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _make_admin(db_session)
    await db_session.commit()
    token = _token(admin, db_session)

    with patch("app.services.ldap_config_service.LdapConfigService.get_config", new_callable=AsyncMock, return_value=DEFAULT_CONFIG):
        response = await client.get("/api/admin/ldap/config", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()["data"]
    assert "bindPasswordSet" in data
    assert data["bindPasswordSet"] is False
    assert "bindPassword" not in data


@pytest.mark.asyncio
async def test_put_ldap_config_saves_and_returns(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _make_admin(db_session)
    await db_session.commit()
    token = _token(admin, db_session)

    saved_config = {**DEFAULT_CONFIG, "server_url": "ldap://192.168.1.1", "bind_password": "secret"}

    with patch("app.services.ldap_config_service.LdapConfigService.save_config", new_callable=AsyncMock, return_value=saved_config):
        response = await client.put(
            "/api/admin/ldap/config",
            headers={"Authorization": f"Bearer {token}"},
            json={"serverUrl": "ldap://192.168.1.1", "bindPassword": "secret"},
        )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["bindPasswordSet"] is True
    assert "bindPassword" not in data


@pytest.mark.asyncio
async def test_put_ldap_config_validation_error(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _make_admin(db_session)
    await db_session.commit()
    token = _token(admin, db_session)

    response = await client.put(
        "/api/admin/ldap/config",
        headers={"Authorization": f"Bearer {token}"},
        json={"serverUrl": "not-a-valid-url"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_post_ldap_test_connection_success(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _make_admin(db_session)
    await db_session.commit()
    token = _token(admin, db_session)

    with patch("app.services.ldap_config_service.LdapConfigService.test_connection", return_value={"success": True, "message": "Conexion exitosa", "details": None}):
        response = await client.post(
            "/api/admin/ldap/test",
            headers={"Authorization": f"Bearer {token}"},
            json={"serverUrl": "ldap://test", "bindDn": "", "bindPassword": ""},
        )

    assert response.status_code == 200
    assert response.json()["data"]["success"] is True


@pytest.mark.asyncio
async def test_post_ldap_test_connection_failure(client: AsyncClient, db_session: AsyncSession) -> None:
    admin = await _make_admin(db_session)
    await db_session.commit()
    token = _token(admin, db_session)

    with patch("app.services.ldap_config_service.LdapConfigService.test_connection", return_value={"success": False, "message": "Error", "details": "refused"}):
        response = await client.post(
            "/api/admin/ldap/test",
            headers={"Authorization": f"Bearer {token}"},
            json={"serverUrl": "ldap://bad", "bindDn": "", "bindPassword": ""},
        )

    assert response.status_code == 200
    assert response.json()["data"]["success"] is False
