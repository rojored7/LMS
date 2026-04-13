import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, Module
from app.models.progress import Enrollment, UserProgress
from app.models.user import User


async def _create_user_and_course(db: AsyncSession) -> tuple[User, Course, Module]:
    user = User(email="prog@test.com", password_hash="h", name="Prog User")
    course = Course(slug="prog-course", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db.add_all([user, course])
    await db.commit()
    await db.refresh(user)
    await db.refresh(course)

    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=30)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return user, course, module


async def test_create_enrollment(db_session: AsyncSession) -> None:
    user, course, _ = await _create_user_and_course(db_session)

    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    await db_session.refresh(enrollment)

    assert enrollment.id is not None
    assert enrollment.progress == 0
    assert enrollment.completed_at is None
    assert enrollment.enrolled_at is not None


async def test_enrollment_unique_user_course(db_session: AsyncSession) -> None:
    user, course, _ = await _create_user_and_course(db_session)

    e1 = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(e1)
    await db_session.commit()

    e2 = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(e2)
    with pytest.raises(IntegrityError):
        await db_session.commit()


async def test_enrollment_no_progress_percentage(db_session: AsyncSession) -> None:
    """CORRECCION: progressPercentage eliminado. Solo existe 'progress'."""
    assert not hasattr(Enrollment, "progress_percentage")


async def test_user_progress_creation(db_session: AsyncSession) -> None:
    user, course, module = await _create_user_and_course(db_session)

    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db_session.add(enrollment)
    await db_session.commit()
    await db_session.refresh(enrollment)

    progress = UserProgress(
        user_id=user.id,
        enrollment_id=enrollment.id,
        module_id=module.id,
        status="in_progress",
        progress=50,
    )
    db_session.add(progress)
    await db_session.commit()
    await db_session.refresh(progress)

    assert progress.id is not None
    assert progress.status == "in_progress"
    assert progress.completed is False
    assert progress.time_spent == 0


async def test_user_progress_has_unique_constraint() -> None:
    """Verify unique constraint exists on (user_id, module_id, lesson_id)."""
    from sqlalchemy import inspect as sa_inspect
    mapper = sa_inspect(UserProgress)
    table = mapper.persist_selectable
    unique_constraints = [
        c for c in table.constraints
        if hasattr(c, "columns") and len(c.columns) > 1
    ]
    col_names = [
        tuple(col.name for col in uc.columns)
        for uc in unique_constraints
    ]
    assert ("user_id", "module_id", "lesson_id") in col_names


async def test_no_user_lesson_progress_model() -> None:
    """CORRECCION: UserLessonProgress eliminado. UserProgress con lesson_id cubre ambos."""
    from app import models
    assert not hasattr(models, "UserLessonProgress")
