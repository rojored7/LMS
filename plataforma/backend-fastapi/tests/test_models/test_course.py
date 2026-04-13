import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel, Module, Lesson, LessonType, CourseProfile
from app.models.user import TrainingProfile


async def test_create_course(db_session: AsyncSession) -> None:
    course = Course(
        slug="intro-ciberseguridad",
        title="Introduccion a Ciberseguridad",
        description="Curso basico de ciberseguridad",
        duration=120,
        level=CourseLevel.BEGINNER,
        author="Instructor Test",
    )
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    assert course.id is not None
    assert course.slug == "intro-ciberseguridad"
    assert course.is_published is False
    assert course.price == 0.0
    assert course.version == "1.0"


async def test_course_slug_unique(db_session: AsyncSession) -> None:
    c1 = Course(slug="unique-slug", title="C1", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    c2 = Course(slug="unique-slug", title="C2", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db_session.add(c1)
    await db_session.commit()

    db_session.add(c2)
    with pytest.raises(IntegrityError):
        await db_session.commit()


async def test_create_module_with_order(db_session: AsyncSession) -> None:
    course = Course(slug="mod-test", title="C", description="D", duration=60, level=CourseLevel.INTERMEDIATE, author="A")
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    m1 = Module(course_id=course.id, order=1, title="Modulo 1", description="Desc", duration=30)
    m2 = Module(course_id=course.id, order=2, title="Modulo 2", description="Desc", duration=30)
    db_session.add_all([m1, m2])
    await db_session.commit()

    result = await db_session.execute(
        select(Module).where(Module.course_id == course.id).order_by(Module.order)
    )
    modules = result.scalars().all()
    assert len(modules) == 2
    assert modules[0].title == "Modulo 1"
    assert modules[1].title == "Modulo 2"


async def test_create_lesson(db_session: AsyncSession) -> None:
    course = Course(slug="lesson-test", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=30)
    db_session.add(module)
    await db_session.commit()
    await db_session.refresh(module)

    lesson = Lesson(
        module_id=module.id,
        order=1,
        title="Leccion 1",
        content="# Contenido markdown",
        type=LessonType.TEXT,
        estimated_time=15,
    )
    db_session.add(lesson)
    await db_session.commit()
    await db_session.refresh(lesson)

    assert lesson.id is not None
    assert lesson.type == LessonType.TEXT


async def test_course_cascade_delete(db_session: AsyncSession) -> None:
    course = Course(slug="cascade-test", title="C", description="D", duration=60, level=CourseLevel.BEGINNER, author="A")
    db_session.add(course)
    await db_session.commit()
    await db_session.refresh(course)

    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=30)
    db_session.add(module)
    await db_session.commit()

    await db_session.delete(course)
    await db_session.commit()

    result = await db_session.execute(select(Module))
    assert len(result.scalars().all()) == 0


async def test_course_profile_pivot(db_session: AsyncSession) -> None:
    profile = TrainingProfile(name="SOC Analyst", slug="soc-analyst", description="SOC path")
    course = Course(slug="soc-course", title="SOC", description="D", duration=60, level=CourseLevel.INTERMEDIATE, author="A")
    db_session.add_all([profile, course])
    await db_session.commit()
    await db_session.refresh(profile)
    await db_session.refresh(course)

    cp = CourseProfile(course_id=course.id, profile_id=profile.id, required=True, order=1)
    db_session.add(cp)
    await db_session.commit()

    result = await db_session.execute(
        select(CourseProfile).where(CourseProfile.profile_id == profile.id)
    )
    cps = result.scalars().all()
    assert len(cps) == 1
    assert cps[0].required is True
    assert cps[0].order == 1
