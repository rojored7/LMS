import pytest
from httpx import AsyncClient

from app.models.user import User, UserRole
from app.utils.security import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_user_and_login(client: AsyncClient, email: str, password: str = "Pass123!") -> str:
    """Registra un usuario limpio y retorna su access token desde la cookie HttpOnly."""
    reg = await client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "name": "Usuario Test",
    })
    assert reg.status_code in (200, 201), reg.text
    token = reg.cookies.get("access_token")
    assert token, f"No se encontro access_token en cookies: {dict(reg.cookies)}"
    return token


# ---------------------------------------------------------------------------
# SEC-012: XSS en campo name del registro
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_rejects_script_tag_in_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "xss1@test.com",
        "password": "Pass123!",
        "name": "<script>alert(document.cookie)</script>",
    })
    assert resp.status_code == 422
    assert "caracteres no permitidos" in resp.text


@pytest.mark.asyncio
async def test_register_rejects_html_entity_ampersand_in_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "xss2@test.com",
        "password": "Pass123!",
        "name": "Tom & Jerry",
    })
    assert resp.status_code == 422
    assert "caracteres no permitidos" in resp.text


@pytest.mark.asyncio
async def test_register_rejects_img_tag_in_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "xss3@test.com",
        "password": "Pass123!",
        "name": '<img src=x onerror=alert(1)>',
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_rejects_double_quote_in_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "xss4@test.com",
        "password": "Pass123!",
        "name": 'Juan "El Bueno"',
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_accepts_normal_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "ok1@test.com",
        "password": "Pass123!",
        "name": "Juan Perez",
    })
    assert resp.status_code in (200, 201)


@pytest.mark.asyncio
async def test_register_accepts_accented_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "ok2@test.com",
        "password": "Pass123!",
        "name": "Maria Jose Nunez",
    })
    assert resp.status_code in (200, 201)


@pytest.mark.asyncio
async def test_register_strips_leading_trailing_spaces_in_name(client: AsyncClient) -> None:
    resp = await client.post("/api/auth/register", json={
        "email": "ok3@test.com",
        "password": "Pass123!",
        "name": "  Carlos  ",
    })
    assert resp.status_code in (200, 201)
    assert resp.json()["data"]["user"]["name"] == "Carlos"


# ---------------------------------------------------------------------------
# SEC-012: XSS en campo name del update de perfil
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_profile_update_rejects_xss_in_name(client: AsyncClient, db_session) -> None:
    token = await _create_user_and_login(client, "xss_profile@test.com")

    resp = await client.put(
        "/api/users/me",
        json={"name": "<script>steal()</script>"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422
    assert "caracteres no permitidos" in resp.text


@pytest.mark.asyncio
async def test_profile_update_accepts_valid_name(client: AsyncClient, db_session) -> None:
    token = await _create_user_and_login(client, "valid_profile@test.com")

    resp = await client.put(
        "/api/users/me",
        json={"name": "Nombre Valido"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Nombre Valido"
