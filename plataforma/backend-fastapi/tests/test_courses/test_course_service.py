import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.course import Course, CourseLevel, Module, Lesson, LessonType
from app.models.user import User
from app.services.course_service import CourseService


async def _seed_course(db: AsyncSession, slug: str = "test-course", published: bool = True) -> Course:
    course = Course(
        slug=slug, title="Test Course", description="Desc",
        duration=120, level=CourseLevel.BEGINNER, author="Author",
        is_published=published,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def _seed_user(db: AsyncSession, email: str = "user@test.com") -> User:
    user = User(email=email, password_hash="h", name="User")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def test_get_published_courses(db_session: AsyncSession) -> None:
    await _seed_course(db_session, "pub-1", published=True)
    await _seed_course(db_session, "pub-2", published=True)
    await _seed_course(db_session, "draft-1", published=False)

    service = CourseService(db_session)
    courses, total = await service.get_published_courses()

    assert total == 2
    assert len(courses) == 2


async def test_get_published_courses_pagination(db_session: AsyncSession) -> None:
    for i in range(5):
        await _seed_course(db_session, f"page-{i}", published=True)

    service = CourseService(db_session)
    courses, total = await service.get_published_courses(page=1, limit=2)

    assert total == 5
    assert len(courses) == 2


async def test_get_published_courses_search(db_session: AsyncSession) -> None:
    c1 = Course(slug="python-sec", title="Python Security", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    c2 = Course(slug="network-sec", title="Network Defense", description="D", duration=60, level=CourseLevel.INTERMEDIATE, author="A", is_published=True)
    db_session.add_all([c1, c2])
    await db_session.commit()

    service = CourseService(db_session)
    courses, total = await service.get_published_courses(search="Python")
    assert total == 1
    assert courses[0].slug == "python-sec"


async def test_get_course_by_id(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session, "by-id")
    service = CourseService(db_session)
    found = await service.get_course_by_id_or_slug(course.id)
    assert found.id == course.id


async def test_get_course_by_slug(db_session: AsyncSession) -> None:
    await _seed_course(db_session, "by-slug")
    service = CourseService(db_session)
    found = await service.get_course_by_id_or_slug("by-slug")
    assert found.slug == "by-slug"


async def test_get_course_not_found(db_session: AsyncSession) -> None:
    service = CourseService(db_session)
    with pytest.raises(NotFoundError):
        await service.get_course_by_id_or_slug("nonexistent")


async def test_create_course(db_session: AsyncSession) -> None:
    service = CourseService(db_session)
    course = await service.create_course(
        slug="new-course", title="New", description="Desc",
        duration=60, level="BEGINNER", author="Auth",
    )
    assert course.id is not None
    assert course.slug == "new-course"
    assert course.is_published is False


async def test_create_course_duplicate_slug(db_session: AsyncSession) -> None:
    await _seed_course(db_session, "dup-slug")
    service = CourseService(db_session)
    with pytest.raises(ConflictError):
        await service.create_course(
            slug="dup-slug", title="Dup", description="D",
            duration=60, level="BEGINNER", author="A",
        )


async def test_update_course(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session, "update-me")
    service = CourseService(db_session)
    updated = await service.update_course(course.id, title="Updated Title", is_published=True)
    assert updated.title == "Updated Title"
    assert updated.is_published is True


async def test_delete_course(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session, "delete-me")
    service = CourseService(db_session)
    await service.delete_course(course.id)

    with pytest.raises(NotFoundError):
        await service.get_course_by_id_or_slug(course.id)


async def test_enroll_user_success(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session)
    course = await _seed_course(db_session, "enroll-test")
    service = CourseService(db_session)

    enrollment, is_new = await service.enroll_user(user.id, course.id)
    assert is_new is True
    assert enrollment.user_id == user.id
    assert enrollment.course_id == course.id
    assert enrollment.progress == 0


async def test_enroll_user_idempotent(db_session: AsyncSession) -> None:
    """Duplicate enrollment returns existing with is_new=False."""
    user = await _seed_user(db_session)
    course = await _seed_course(db_session, "idem-test")
    service = CourseService(db_session)

    e1, is_new1 = await service.enroll_user(user.id, course.id)
    e2, is_new2 = await service.enroll_user(user.id, course.id)

    assert is_new1 is True
    assert is_new2 is False
    assert e1.id == e2.id


async def test_enroll_unpublished_course_fails(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session)
    course = await _seed_course(db_session, "unpub", published=False)
    service = CourseService(db_session)

    with pytest.raises(NotFoundError, match="no publicado"):
        await service.enroll_user(user.id, course.id)


async def test_get_user_enrollments(db_session: AsyncSession) -> None:
    user = await _seed_user(db_session)
    c1 = await _seed_course(db_session, "enrolled-1")
    c2 = await _seed_course(db_session, "enrolled-2")
    service = CourseService(db_session)
    await service.enroll_user(user.id, c1.id)
    await service.enroll_user(user.id, c2.id)

    enrollments = await service.get_user_enrollments(user.id)
    assert len(enrollments) == 2


async def test_get_course_modules_ordered(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session, "modules-test")
    m2 = Module(course_id=course.id, order=2, title="M2", description="D", duration=30)
    m1 = Module(course_id=course.id, order=1, title="M1", description="D", duration=30)
    db_session.add_all([m2, m1])
    await db_session.commit()

    service = CourseService(db_session)
    modules = await service.get_course_modules(course.id)
    assert len(modules) == 2
    assert modules[0].order == 1
    assert modules[1].order == 2


async def test_get_module_lessons_ordered(db_session: AsyncSession) -> None:
    course = await _seed_course(db_session, "lessons-test")
    module = Module(course_id=course.id, order=1, title="M", description="D", duration=30)
    db_session.add(module)
    await db_session.commit()
    await db_session.refresh(module)

    l2 = Lesson(module_id=module.id, order=2, title="L2", content="C", type=LessonType.TEXT, estimated_time=10)
    l1 = Lesson(module_id=module.id, order=1, title="L1", content="C", type=LessonType.VIDEO, estimated_time=15)
    db_session.add_all([l2, l1])
    await db_session.commit()

    service = CourseService(db_session)
    lessons = await service.get_module_lessons(module.id)
    assert len(lessons) == 2
    assert lessons[0].order == 1
    assert lessons[1].order == 2
