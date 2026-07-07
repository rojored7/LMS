"""M-04: /api/uploads debe requerir autenticacion + proteccion anti path-traversal."""
import os
import tempfile
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services.token_service import TokenService
from app.utils.security import hash_password


async def _make_user(db: AsyncSession, email: str) -> User:
    user = User(email=email, password_hash=hash_password("Pass1!"), name="Test", role=UserRole.STUDENT)
    db.add(user)
    await db.flush()
    return user


def _token_for(user: User, db: AsyncSession) -> str:
    ts = TokenService(db)
    return ts.create_access_token(user.id, user.email, user.role.value)


@pytest.mark.asyncio
async def test_uploads_unauthenticated_gets_401(client: AsyncClient) -> None:
    """M-04: Sin token debe devolver 401."""
    response = await client.get("/api/uploads/some-file.jpg")
    assert response.status_code == 401, (
        f"Sin token debe devolver 401, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_uploads_path_traversal_url_normalized_gets_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-04: Path traversal via URL (../etc/passwd) es normalizado por HTTP -> 404 seguro."""
    user = await _make_user(db_session, "m04-traversal@test.com")
    await db_session.commit()
    token = _token_for(user, db_session)

    # HTTP/Starlette normaliza ../ en la URL antes de routing, resultando en 404 seguro
    response = await client.get(
        "/api/uploads/../etc/passwd",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code in (403, 404), (
        f"Path traversal debe devolver 403 o 404, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_uploads_symlink_traversal_gets_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-04: Symlink dentro de uploads apuntando fuera del dir debe devolver 403."""
    user = await _make_user(db_session, "m04-symlink@test.com")
    await db_session.commit()
    token = _token_for(user, db_session)

    with tempfile.TemporaryDirectory() as uploads_dir:
        with tempfile.TemporaryDirectory() as outside_dir:
            outside_file = os.path.join(outside_dir, "secret.txt")
            with open(outside_file, "w") as f:
                f.write("secreto")

            # Crear symlink dentro de uploads apuntando al archivo externo
            symlink_path = os.path.join(uploads_dir, "evil-link.txt")
            os.symlink(outside_file, symlink_path)

            with patch("app.routers.uploads._UPLOADS_DIR", os.path.realpath(uploads_dir)):
                response = await client.get(
                    "/api/uploads/evil-link.txt",
                    headers={"Authorization": f"Bearer {token}"},
                )
    assert response.status_code == 403, (
        f"Symlink fuera de uploads_dir debe devolver 403, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_uploads_nonexistent_file_gets_404(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-04: Archivo que no existe debe devolver 404."""
    user = await _make_user(db_session, "m04-404@test.com")
    await db_session.commit()
    token = _token_for(user, db_session)

    response = await client.get(
        "/api/uploads/nonexistent-file-xyz.pdf",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404, (
        f"Archivo inexistente debe devolver 404, got {response.status_code}"
    )


@pytest.mark.asyncio
async def test_uploads_valid_file_gets_200(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """M-04: Archivo valido con usuario autenticado debe devolver 200."""
    user = await _make_user(db_session, "m04-200@test.com")
    await db_session.commit()
    token = _token_for(user, db_session)

    with tempfile.TemporaryDirectory() as tmpdir:
        test_file = os.path.join(tmpdir, "test-upload.txt")
        with open(test_file, "w") as f:
            f.write("contenido de prueba")

        with patch("app.routers.uploads._UPLOADS_DIR", os.path.realpath(tmpdir)):
            response = await client.get(
                "/api/uploads/test-upload.txt",
                headers={"Authorization": f"Bearer {token}"},
            )
    assert response.status_code == 200, (
        f"Archivo valido debe devolver 200, got {response.status_code}"
    )


