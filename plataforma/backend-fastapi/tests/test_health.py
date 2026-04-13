from httpx import AsyncClient


async def test_health_endpoint(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


async def test_api_root(client: AsyncClient) -> None:
    response = await client.get("/api")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "2.0.0"
    assert "endpoints" in data
    assert data["endpoints"]["auth"] == "/api/auth"
    assert data["endpoints"]["courses"] == "/api/courses"
    assert data["endpoints"]["progress"] == "/api/progress"


async def test_security_headers(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert "strict-transport-security" in response.headers
    assert "content-security-policy" in response.headers
    assert "permissions-policy" in response.headers
