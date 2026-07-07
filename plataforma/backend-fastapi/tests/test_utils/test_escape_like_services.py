"""Tests de integracion: escape_like aplicado en course_service y user_service.

Verifica que caracteres LIKE especiales en search no rompen la query
ni filtran resultados incorrectos.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseLevel
from app.models.user import User, UserRole
from app.services.course_service import CourseService
from app.services.user_service import UserService


async def test_course_search_with_percent_returns_empty(db_session: AsyncSession) -> None:
    course = Course(
        slug="curso-normal", title="Seguridad Informatica", description="D",
        duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True,
    )
    db_session.add(course)
    await db_session.commit()

    service = CourseService(db_session)
    results, total = await service.get_published_courses(search="%")
    # % no debe matchear todo — debe buscar el literal '%' que no existe en ningun titulo
    assert total == 0


async def test_course_search_with_underscore_is_literal(db_session: AsyncSession) -> None:
    c1 = Course(slug="c1", title="Python_Security", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    c2 = Course(slug="c2", title="Python Security", description="D", duration=60, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db_session.add_all([c1, c2])
    await db_session.commit()

    service = CourseService(db_session)
    results, total = await service.get_published_courses(search="Python_Security")
    # Solo debe matchear el que tiene _ literal en el titulo
    assert total == 1
    assert results[0].title == "Python_Security"


async def test_user_search_with_percent_returns_empty(db_session: AsyncSession) -> None:
    user = User(email="test@example.com", password_hash="h", name="Admin User", role=UserRole.ADMIN)
    db_session.add(user)
    await db_session.commit()

    service = UserService(db_session)
    results, total = await service.get_all_users(search="%")
    # % no debe matchear todos los usuarios
    assert total == 0


async def test_user_search_normal_works(db_session: AsyncSession) -> None:
    u1 = User(email="juan@test.com", password_hash="h", name="Juan Perez", role=UserRole.STUDENT)
    u2 = User(email="maria@test.com", password_hash="h", name="Maria Lopez", role=UserRole.STUDENT)
    db_session.add_all([u1, u2])
    await db_session.commit()

    service = UserService(db_session)
    results, total = await service.get_all_users(search="Juan")
    assert total == 1
    assert results[0].name == "Juan Perez"
