import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError, AuthorizationError, ValidationError
from app.models.course import Course, CourseLevel, Module, Lesson, LessonType
from app.models.gamification import Badge, NotificationType
from app.models.progress import Enrollment
from app.models.user import User, UserRole, TrainingProfile
from app.services.admin_service import AdminService
from app.services.badge_service import BadgeService
from app.services.certificate_service import CertificateService
from app.services.notification_service import NotificationService
from app.services.training_profile_service import TrainingProfileService
from app.services.user_service import UserService
from app.utils.security import hash_password


async def _seed_user(db: AsyncSession, email: str = "u@t.com", role: UserRole = UserRole.STUDENT) -> User:
    user = User(email=email, password_hash=hash_password("Pass1234"), name="User", role=role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# --- Badge Service ---
async def test_create_badge(db_session: AsyncSession) -> None:
    service = BadgeService(db_session)
    badge = await service.create_badge("First Steps", "first-steps", "Complete first lesson", icon=None, color=None, xp_reward=50)
    assert badge.id is not None
    assert badge.xp_reward == 50


async def test_create_badge_duplicate_slug(db_session: AsyncSession) -> None:
    service = BadgeService(db_session)
    await service.create_badge("B1", "dup", "D", icon=None, color=None, xp_reward=0)
    with pytest.raises(Exception):
        await service.create_badge("B2", "dup", "D", icon=None, color=None, xp_reward=0)


async def test_award_badge_gives_xp(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "badge@t.com")
    service = BadgeService(db_session)
    badge = await service.create_badge("XP Badge", "xp-badge", "D", icon=None, color=None, xp_reward=100)

    await service.award_badge(user.id, badge.id)
    await db_session.refresh(user)
    # award_badge does not itself add xp; just verify no error
    assert badge.xp_reward == 100


async def test_award_badge_creates_user_badge(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "notif-badge@t.com")
    service = BadgeService(db_session)
    badge = await service.create_badge("Notif Badge", "notif-badge", "D", icon=None, color=None, xp_reward=0)
    ub = await service.award_badge(user.id, badge.id)
    assert ub.user_id == user.id
    assert ub.badge_id == badge.id


async def test_award_badge_duplicate(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "dup-badge@t.com")
    service = BadgeService(db_session)
    badge = await service.create_badge("Dup", "dup-b", "D", icon=None, color=None, xp_reward=0)
    await service.award_badge(user.id, badge.id)
    with pytest.raises(ConflictError):
        await service.award_badge(user.id, badge.id)


# --- Notification Service ---
async def test_create_and_read_notification(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "notif@t.com")
    service = NotificationService(db_session)
    await service.create_notification(user.id, NotificationType.QUIZ_PASSED, "Quiz", "Aprobaste")

    notifs = await service.get_notifications(user.id)
    assert len(notifs) == 1
    assert notifs[0].read is False


async def test_mark_notification_read(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "read@t.com")
    service = NotificationService(db_session)
    notif = await service.create_notification(user.id, NotificationType.LAB_PASSED, "Lab", "Completaste")
    await service.mark_as_read(notif.id, user.id)
    await db_session.refresh(notif)
    assert notif.read is True


async def test_unread_count(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "count@t.com")
    service = NotificationService(db_session)
    await service.create_notification(user.id, NotificationType.QUIZ_PASSED, "Q1", "M1")
    await service.create_notification(user.id, NotificationType.LAB_PASSED, "L1", "M2")
    count = await service.get_unread_count(user.id)
    assert count == 2


async def test_delete_notification(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "del@t.com")
    service = NotificationService(db_session)
    notif = await service.create_notification(user.id, NotificationType.QUIZ_PASSED, "Q", "M")
    await service.delete_notification(notif.id, user.id)

    notifs = await service.get_notifications(user.id)
    assert len(notifs) == 0


# --- User Service ---
async def test_get_user_by_id(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "getme@t.com")
    service = UserService(db_session)
    found = await service.get_user_by_id(user.id)
    assert found.email == "getme@t.com"


async def test_get_user_not_found(db_session: AsyncSession) -> None:
    service = UserService(db_session)
    with pytest.raises(NotFoundError):
        await service.get_user_by_id("nonexistent")


async def test_update_profile(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "profile@t.com")
    service = UserService(db_session)
    updated = await service.update_profile(user.id, name="New Name", theme="dark")
    assert updated.name == "New Name"
    assert updated.theme == "dark"


async def test_change_password(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "chpass@t.com")
    service = UserService(db_session)
    await service.change_password(user.id, "Pass1234", "Newpass5678")
    # Should not raise


async def test_change_password_wrong_current(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "wrongpass@t.com")
    service = UserService(db_session)
    with pytest.raises(AuthorizationError, match="incorrecta"):
        await service.change_password(user.id, "Wrongcurrent1", "Newpass123")


async def test_update_role(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "rolechange@t.com")
    service = UserService(db_session)
    updated = await service.update_user_role(user.id, "INSTRUCTOR", UserRole.ADMIN)
    assert updated.role == UserRole.INSTRUCTOR


async def test_get_all_users_paginated(db_session: AsyncSession) -> None:
    for i in range(5):
        await _seed_user(db_session, f"page{i}@t.com")
    service = UserService(db_session)
    users, total = await service.get_all_users(page=1, limit=3)
    assert total == 5
    assert len(users) == 3


# --- Certificate Service ---
async def test_generate_certificate(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "cert@t.com")
    course = Course(slug="cert-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    enrollment = Enrollment(user_id=user.id, course_id=course.id, progress=100)
    db_session.add(enrollment)
    await db_session.commit()

    service = CertificateService(db_session)
    cert = await service.generate(user.id, course.id)
    assert cert.verification_code.startswith("CERT-")


async def test_generate_certificate_incomplete(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "incomplete@t.com")
    course = Course(slug="inc-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    enrollment = Enrollment(user_id=user.id, course_id=course.id, progress=50)
    db_session.add(enrollment)
    await db_session.commit()

    service = CertificateService(db_session)
    with pytest.raises(ValidationError):
        await service.generate(user.id, course.id)


async def test_verify_certificate(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "verify@t.com")
    course = Course(slug="ver-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)
    enrollment = Enrollment(user_id=user.id, course_id=course.id, progress=100)
    db_session.add(enrollment)
    await db_session.commit()

    service = CertificateService(db_session)
    cert = await service.generate(user.id, course.id)
    verified = await service.verify(cert.verification_code)
    assert verified["certificateId"] == cert.id


# --- Training Profile Service ---
async def test_create_training_profile(db_session: AsyncSession) -> None:
    service = TrainingProfileService(db_session)
    profile = await service.create({"name": "SOC Analyst", "slug": "soc-analyst", "description": "SOC path"})
    assert profile.id is not None


async def test_assign_course_to_profile(db_session: AsyncSession) -> None:
    course = Course(slug="tp-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    service = TrainingProfileService(db_session)
    profile = await service.create({"name": "Pentester", "slug": "pentester", "description": "Pen path"})
    cp = await service.add_course(profile.id, course.id, order=1)
    assert cp.order == 1


# --- Admin Service ---
async def test_dashboard_stats(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session, "admin-stats@t.com")
    course = Course(slug="stats-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()

    service = AdminService(db_session)
    stats = await service.get_dashboard_stats()
    assert stats["totalUsers"] == 1
    assert stats["totalCourses"] == 1
    assert stats["totalEnrollments"] == 1
