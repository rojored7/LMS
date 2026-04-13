import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import Badge, UserBadge, Certificate, Notification, NotificationType
from app.models.content import AuditLog
from app.models.course import Course, CourseLevel
from app.models.user import User


async def test_create_badge(db_session: AsyncSession) -> None:
    badge = Badge(
        name="Quiz Master",
        slug="quiz-master",
        description="Aprobaste todos los quizzes",
        xp_reward=100,
    )
    db_session.add(badge)
    await db_session.commit()
    await db_session.refresh(badge)

    assert badge.id is not None
    assert badge.xp_reward == 100


async def test_user_badge_unique(db_session: AsyncSession) -> None:
    user = User(email="badge@test.com", password_hash="h", name="Badge User")
    badge = Badge(name="First Badge", slug="first-badge", description="D")
    db_session.add_all([user, badge])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(badge)

    ub1 = UserBadge(user_id=user.id, badge_id=badge.id)
    db_session.add(ub1)
    await db_session.commit()

    ub2 = UserBadge(user_id=user.id, badge_id=badge.id)
    db_session.add(ub2)
    with pytest.raises(IntegrityError):
        await db_session.commit()


async def test_certificate_unique_per_user_course(db_session: AsyncSession) -> None:
    user = User(email="cert@test.com", password_hash="h", name="Cert User")
    course = Course(slug="cert-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db_session.add_all([user, course])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(course)

    c1 = Certificate(
        user_id=user.id,
        course_id=course.id,
        certificate_url="/certs/1.pdf",
        verification_code="VERIFY-001",
    )
    db_session.add(c1)
    await db_session.commit()

    c2 = Certificate(
        user_id=user.id,
        course_id=course.id,
        certificate_url="/certs/2.pdf",
        verification_code="VERIFY-002",
    )
    db_session.add(c2)
    with pytest.raises(IntegrityError):
        await db_session.commit()


async def test_notification_creation(db_session: AsyncSession) -> None:
    user = User(email="notif@test.com", password_hash="h", name="Notif User")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    notif = Notification(
        user_id=user.id,
        type=NotificationType.BADGE_AWARDED,
        title="Badge obtenido",
        message="Obtuviste el badge Quiz Master",
        data={"badge_id": "some-id"},
    )
    db_session.add(notif)
    await db_session.commit()
    await db_session.refresh(notif)

    assert notif.read is False
    assert notif.type == NotificationType.BADGE_AWARDED


async def test_audit_log_with_user_fk(db_session: AsyncSession) -> None:
    """CORRECCION: AuditLog ahora tiene FK a User."""
    user = User(email="audit@test.com", password_hash="h", name="Audit User")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    log = AuditLog(
        user_id=user.id,
        action="COURSE_CREATED",
        entity_type="Course",
        entity_id="some-course-id",
        metadata_json={"title": "New Course"},
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    assert log.id is not None
    assert log.user_id == user.id


async def test_audit_log_has_user_foreign_key() -> None:
    """CORRECCION: AuditLog.user_id is a FK to users table (not a loose string)."""
    from sqlalchemy import inspect as sa_inspect
    mapper = sa_inspect(AuditLog)
    user_id_col = mapper.columns["user_id"]
    fks = list(user_id_col.foreign_keys)
    assert len(fks) == 1
    assert str(fks[0].target_fullname) == "users.id"
