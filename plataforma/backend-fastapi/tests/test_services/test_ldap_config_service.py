"""Slice 3: tests de LdapConfigService."""
import base64
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ldap_config_service import (
    LdapConfigService,
    _decrypt,
    _encrypt,
    _get_fernet,
)


def test_fernet_key_is_valid_base64():
    fernet = _get_fernet()
    assert fernet is not None


def test_encrypt_decrypt_roundtrip():
    plaintext = "s3cr3t!"
    assert _decrypt(_encrypt(plaintext)) == plaintext


def test_encrypt_empty_returns_empty():
    assert _encrypt("") == ""


def test_decrypt_empty_returns_empty():
    assert _decrypt("") == ""


@pytest.mark.asyncio
async def test_get_config_returns_defaults_when_no_row():
    db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result

    service = LdapConfigService()
    with patch("app.services.ldap_config_service._env_fallback", return_value={"server_url": "", "bind_password": ""}):
        config = await service.get_config(db)
    assert "server_url" in config
    assert "bind_password" in config


@pytest.mark.asyncio
async def test_get_config_decrypts_password_from_row():
    from app.models.admin_config import LdapConfiguration

    db = AsyncMock(spec=AsyncSession)
    row = LdapConfiguration(
        server_url="ldap://test",
        bind_password_encrypted=_encrypt("mysecret"),
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = row
    db.execute.return_value = mock_result

    service = LdapConfigService()
    config = await service.get_config(db)
    assert config["bind_password"] == "mysecret"
    assert config["server_url"] == "ldap://test"


@pytest.mark.asyncio
async def test_save_config_creates_row_and_encrypts_password():
    from app.models.admin_config import LdapConfiguration

    db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result
    db.refresh = AsyncMock(side_effect=lambda row: None)

    service = LdapConfigService()
    data = {
        "server_url": "ldap://192.168.1.1",
        "use_ssl": False,
        "timeout": 10,
        "bind_dn": "CN=svc",
        "bind_password": "pass123",
        "base_dn": "DC=corp",
        "search_filter": "(sAMAccountName={username})",
        "email_attr": "mail",
        "name_attr": "cn",
        "group_attr": "memberOf",
        "role_mapping": "{}",
    }

    saved = await service.save_config(db, data)
    db.add.assert_called_once()
    db.commit.assert_called_once()
    added_row = db.add.call_args[0][0]
    assert added_row.bind_password_encrypted != "pass123"
    assert _decrypt(added_row.bind_password_encrypted) == "pass123"


@pytest.mark.asyncio
async def test_save_config_preserves_password_when_none():
    from app.models.admin_config import LdapConfiguration

    db = AsyncMock(spec=AsyncSession)
    existing_row = LdapConfiguration(
        server_url="ldap://old",
        bind_password_encrypted=_encrypt("original"),
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_row
    db.execute.return_value = mock_result
    db.refresh = AsyncMock(side_effect=lambda row: None)

    service = LdapConfigService()
    await service.save_config(db, {"server_url": "ldap://new", "bind_password": None})
    assert _decrypt(existing_row.bind_password_encrypted) == "original"


def test_test_connection_returns_failure_on_exception():
    service = LdapConfigService()
    with patch("ldap3.Server", side_effect=Exception("unreachable")):
        result = service.test_connection({"server_url": "ldap://bad", "bind_dn": "", "bind_password": "", "use_ssl": False, "timeout": 5})
    assert result["success"] is False
    assert "unreachable" in result["details"]
