"""
SEC-009: Tests para get_real_ip con validacion de trusted proxy.

get_real_ip se testea como funcion pura con objetos Request mock,
sin necesidad de levantar la app ni Redis.
"""
from unittest.mock import MagicMock

import pytest

from app.middleware.rate_limit import get_real_ip


def _make_request(client_host: str | None, x_real_ip: str | None = None, x_forwarded_for: str | None = None) -> MagicMock:
    """Construye un Request mock con los campos relevantes."""
    request = MagicMock()
    if client_host is None:
        request.client = None
    else:
        request.client = MagicMock()
        request.client.host = client_host

    headers: dict[str, str] = {}
    if x_real_ip is not None:
        headers["X-Real-IP"] = x_real_ip
    if x_forwarded_for is not None:
        headers["X-Forwarded-For"] = x_forwarded_for
    request.headers = headers
    return request


# ---------------------------------------------------------------------------
# Cliente no confiable: ignora cabeceras de override
# ---------------------------------------------------------------------------

def test_untrusted_client_ignores_x_forwarded_for() -> None:
    """Un cliente publico no puede suplantar su IP via X-Forwarded-For."""
    request = _make_request("1.2.3.4", x_forwarded_for="9.9.9.9")
    assert get_real_ip(request) == "1.2.3.4"


def test_untrusted_client_ignores_x_real_ip() -> None:
    """Un cliente publico no puede suplantar su IP via X-Real-IP."""
    request = _make_request("5.6.7.8", x_real_ip="10.0.0.1")
    assert get_real_ip(request) == "5.6.7.8"


# ---------------------------------------------------------------------------
# Cliente de proxy confiable (red Docker interna): usa cabecera
# ---------------------------------------------------------------------------

def test_trusted_proxy_uses_x_real_ip() -> None:
    """Nginx interno (172.28.x.x) puede pasar la IP real via X-Real-IP."""
    request = _make_request("172.28.0.5", x_real_ip="5.6.7.8")
    assert get_real_ip(request) == "5.6.7.8"


def test_trusted_proxy_uses_x_forwarded_for_when_no_x_real_ip() -> None:
    """Proxy confiable sin X-Real-IP usa el primer valor de X-Forwarded-For."""
    request = _make_request("172.29.0.2", x_forwarded_for="3.3.3.3, 4.4.4.4")
    assert get_real_ip(request) == "3.3.3.3"


def test_trusted_proxy_prefers_x_real_ip_over_x_forwarded_for() -> None:
    """X-Real-IP tiene prioridad sobre X-Forwarded-For cuando ambos estan presentes."""
    request = _make_request("172.30.0.1", x_real_ip="100.0.0.1", x_forwarded_for="200.0.0.1")
    assert get_real_ip(request) == "100.0.0.1"


def test_trusted_proxy_returns_client_ip_when_no_headers() -> None:
    """Proxy confiable sin cabeceras de override devuelve su propia IP."""
    request = _make_request("172.28.1.100")
    assert get_real_ip(request) == "172.28.1.100"


# ---------------------------------------------------------------------------
# Caso borde: sin client
# ---------------------------------------------------------------------------

def test_no_client_returns_unknown() -> None:
    """Cuando request.client es None devuelve 'unknown'."""
    request = _make_request(None)
    assert get_real_ip(request) == "unknown"
