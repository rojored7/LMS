"""Tests para fixes de seguridad del servicio LDAP:
- Injection prevention via escape_filter_chars
- Event loop blocking via asyncio.to_thread
- LDAP_ENABLED=False no llama a _bind_user
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.ldap_service import LdapService

MOCK_LDAP_CONFIG = {
    "server_url": "ldap://test",
    "use_ssl": False,
    "timeout": 10,
    "bind_dn": "CN=svc",
    "bind_password": "svcpass",
    "base_dn": "DC=corp",
    "search_filter": "(sAMAccountName={username})",
    "email_attr": "mail",
    "name_attr": "cn",
    "group_attr": "memberOf",
    "role_mapping": "{}",
}


@pytest.mark.asyncio
async def test_ldap_disabled_does_not_call_bind() -> None:
    """Cuando no hay config LDAP en DB, authenticate_and_sync falla antes de llamar a _bind_user."""
    svc = LdapService()
    bind_called = []

    async def fake_to_thread(func, *args, **kwargs):
        bind_called.append(True)
        return None

    with patch("app.services.ldap_config_service.LdapConfigService.ldap_is_configured", new_callable=AsyncMock, return_value=False), \
         patch("app.services.ldap_service.asyncio") as mock_asyncio:
        mock_asyncio.to_thread = fake_to_thread

        from app.middleware.error_handler import ValidationError
        with pytest.raises(ValidationError, match="LDAP no esta habilitado"):
            await svc.authenticate_and_sync("user", "pass", MagicMock(), MagicMock())

    assert not bind_called, "asyncio.to_thread fue llamado cuando LDAP no esta configurado"


@pytest.mark.asyncio
async def test_ldap_bind_uses_asyncio_to_thread() -> None:
    """authenticate_and_sync debe llamar a asyncio.to_thread con _bind_user."""
    svc = LdapService()

    async def fake_to_thread(func, *args, **kwargs):
        return None

    with patch("app.services.ldap_config_service.LdapConfigService.ldap_is_configured", new_callable=AsyncMock, return_value=True), \
         patch("app.services.ldap_config_service.LdapConfigService.get_config", new_callable=AsyncMock, return_value=MOCK_LDAP_CONFIG), \
         patch("app.services.ldap_service.asyncio") as mock_asyncio:
        mock_asyncio.to_thread = AsyncMock(side_effect=fake_to_thread)

        from app.middleware.error_handler import AuthenticationError
        with pytest.raises(AuthenticationError):
            await svc.authenticate_and_sync("user", "pass", MagicMock(), MagicMock())

    mock_asyncio.to_thread.assert_awaited_once()
    call_args = mock_asyncio.to_thread.call_args
    assert call_args[0][0].__name__ == "_bind_user", (
        f"asyncio.to_thread debe recibir _bind_user, got: {call_args[0][0]}"
    )


@pytest.mark.asyncio
async def test_ldap_escape_filter_chars_applied_to_username() -> None:
    """El username debe escaparse con escape_filter_chars antes de pasarse a _bind_user."""
    svc = LdapService()
    received_safe_username = {}

    async def fake_to_thread(func, safe_username, password, config):
        received_safe_username["value"] = safe_username
        return None

    malicious_username = "admin)(|(uid=*"

    with patch("app.services.ldap_config_service.LdapConfigService.ldap_is_configured", new_callable=AsyncMock, return_value=True), \
         patch("app.services.ldap_config_service.LdapConfigService.get_config", new_callable=AsyncMock, return_value=MOCK_LDAP_CONFIG), \
         patch("app.services.ldap_service.asyncio") as mock_asyncio:
        mock_asyncio.to_thread = AsyncMock(side_effect=fake_to_thread)

        from app.middleware.error_handler import AuthenticationError
        with pytest.raises(AuthenticationError):
            await svc.authenticate_and_sync(malicious_username, "pass", MagicMock(), MagicMock())

    assert "value" in received_safe_username, "to_thread no fue llamado con username"
    escaped = received_safe_username["value"]
    assert ")(|" not in escaped, f"Caracteres LDAP injection no escapados: {escaped}"
    assert "*" not in escaped or "\\2a" in escaped.lower() or "\\*" in escaped, (
        f"El wildcard * no fue escapado: {escaped}"
    )


def test_escape_filter_chars_available() -> None:
    """Verificar que ldap3.utils.conv.escape_filter_chars esta disponible en el entorno."""
    from ldap3.utils.conv import escape_filter_chars
    dangerous = "admin)(|(uid=*"
    escaped = escape_filter_chars(dangerous)
    assert ")(|" not in escaped
    assert "*" not in escaped or "\\2a" in escaped.lower() or "\\*" in escaped
