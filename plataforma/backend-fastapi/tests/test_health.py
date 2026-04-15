from httpx import AsyncClient


async def test_health_endpoint(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


async def test_health_live_endpoint(client: AsyncClient) -> None:
    response = await client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"


async def test_security_headers(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    # X-XSS-Protection removed (deprecated in modern browsers)
    assert "content-security-policy" in response.headers
    assert "permissions-policy" in response.headers
    assert "referrer-policy" in response.headers
