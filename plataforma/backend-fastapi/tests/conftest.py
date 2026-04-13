import os
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.update({
    "NODE_ENV": "test",
    "DATABASE_URL": "sqlite+aiosqlite://",
    "REDIS_URL": "redis://localhost:6379/1",
    "JWT_SECRET": "ciber-testing-jwt-k3y-f0r-unit-t3sts-only-64chars-xxxxxxxxxxxx",
    "JWT_REFRESH_SECRET": "ciber-testing-r3fresh-k3y-f0r-unit-t3sts-64chars-xxxxxxxxxxxx",
    "EXECUTOR_SECRET": "test-executor-secret-value-for-testing",
})

from app.database import Base, get_db  # noqa: E402
import app.models  # noqa: E402, F401  # Register all models with Base.metadata
from app.main import app  # noqa: E402
from app.middleware.rate_limit import limiter  # noqa: E402

# Disable rate limiting in tests
limiter.enabled = False

test_engine = create_async_engine("sqlite+aiosqlite://", echo=False)
test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_session() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with test_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
