from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole, TrainingProfile, RefreshToken, PasswordResetToken


async def test_create_user(db_session: AsyncSession) -> None:
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User",
        role=UserRole.STUDENT,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.role == UserRole.STUDENT
    assert user.xp == 0
    assert user.theme == "system"
    assert user.locale == "es"


async def test_user_email_unique(db_session: AsyncSession) -> None:
    user1 = User(email="dup@test.com", password_hash="hash1", name="User 1")
    user2 = User(email="dup@test.com", password_hash="hash2", name="User 2")
    db_session.add(user1)
    await db_session.commit()

    db_session.add(user2)
    from sqlalchemy.exc import IntegrityError
    import pytest
    with pytest.raises(IntegrityError):
        await db_session.commit()


async def test_user_roles(db_session: AsyncSession) -> None:
    admin = User(email="admin@test.com", password_hash="h", name="Admin", role=UserRole.ADMIN)
    instructor = User(email="inst@test.com", password_hash="h", name="Inst", role=UserRole.INSTRUCTOR)
    student = User(email="stud@test.com", password_hash="h", name="Stud", role=UserRole.STUDENT)

    db_session.add_all([admin, instructor, student])
    await db_session.commit()

    result = await db_session.execute(select(User).where(User.role == UserRole.ADMIN))
    admins = result.scalars().all()
    assert len(admins) == 1
    assert admins[0].email == "admin@test.com"


async def test_user_default_values(db_session: AsyncSession) -> None:
    user = User(email="defaults@test.com", password_hash="h", name="Defaults")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.role == UserRole.STUDENT
    assert user.xp == 0
    assert user.theme == "system"
    assert user.locale == "es"
    assert user.avatar is None
    assert user.training_profile_id is None
    assert user.last_login_at is None
    assert user.created_at is not None
    assert user.updated_at is not None


async def test_training_profile_creation(db_session: AsyncSession) -> None:
    profile = TrainingProfile(
        name="SOC Analyst",
        slug="soc-analyst",
        description="Security Operations Center Analyst path",
        icon="shield",
        color="#FF5733",
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)

    assert profile.id is not None
    assert profile.slug == "soc-analyst"


async def test_user_training_profile_relation(db_session: AsyncSession) -> None:
    profile = TrainingProfile(name="Pentester", slug="pentester", description="Pentesting path")
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)

    user = User(
        email="pentester@test.com",
        password_hash="h",
        name="Pen Tester",
        training_profile_id=profile.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.training_profile_id == profile.id


async def test_refresh_token_creation(db_session: AsyncSession) -> None:
    from datetime import datetime, timedelta, timezone

    user = User(email="token@test.com", password_hash="h", name="Token User")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = RefreshToken(
        user_id=user.id,
        token="unique-refresh-token-value",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(token)
    await db_session.commit()
    await db_session.refresh(token)

    assert token.id is not None
    assert token.user_id == user.id


async def test_refresh_token_cascade_delete(db_session: AsyncSession) -> None:
    from datetime import datetime, timedelta, timezone

    user = User(email="cascade@test.com", password_hash="h", name="Cascade User")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = RefreshToken(
        user_id=user.id,
        token="cascade-token",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(token)
    await db_session.commit()

    await db_session.delete(user)
    await db_session.commit()

    result = await db_session.execute(select(RefreshToken))
    tokens = result.scalars().all()
    assert len(tokens) == 0


async def test_password_reset_token(db_session: AsyncSession) -> None:
    from datetime import datetime, timedelta, timezone

    user = User(email="reset@test.com", password_hash="h", name="Reset User")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token="reset-token-unique",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(reset_token)
    await db_session.commit()
    await db_session.refresh(reset_token)

    assert reset_token.id is not None
    assert reset_token.used_at is None
