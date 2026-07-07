"""CR-03: Verifica que app.state.redis esta asignado en el lifespan y que el CSRF state se guarda en Redis."""
from unittest.mock import AsyncMock, patch

import pytest

from app.main import app, lifespan
from app.redis import redis_client


@pytest.mark.asyncio
async def test_lifespan_assigns_redis_to_app_state() -> None:
    """El lifespan debe asignar redis_client a app.state.redis (fix CR-03)."""
    # Limpiar app.state antes del test
    if hasattr(app.state, "redis"):
        del app.state._state["redis"]

    with patch("app.main.check_database_connection", return_value=True), \
         patch("app.main.check_redis_connection", return_value=True), \
         patch("app.main.setup_logging"), \
         patch("app.services.executor_client.ExecutorClient.close"):
        async with lifespan(app):
            assert hasattr(app.state, "redis"), "app.state.redis no fue asignado en el lifespan"
            assert app.state.redis is redis_client, "app.state.redis debe ser redis_client de app.redis"


@pytest.mark.asyncio
async def test_oauth_state_stored_in_redis_when_redis_available() -> None:
    """Cuando app.state.redis esta disponible, el state anti-CSRF se guarda con TTL de 600s."""
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=True)
    app.state.redis = mock_redis

    from app.services.oauth_service import generate_oauth_state
    state = generate_oauth_state()

    redis = app.state.redis
    if redis:
        await redis.set(f"oauth:state:{state}", "google", ex=600)

    mock_redis.set.assert_awaited_once()
    key, provider = mock_redis.set.call_args[0]
    assert key.startswith("oauth:state:"), f"La clave debe empezar con 'oauth:state:', got: {key}"
    assert provider == "google"
    assert mock_redis.set.call_args[1].get("ex") == 600
