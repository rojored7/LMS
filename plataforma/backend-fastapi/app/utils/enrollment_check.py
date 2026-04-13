from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.middleware.error_handler import AuthorizationError
from app.models.progress import Enrollment
from app.models.user import UserRole


async def verify_enrollment_or_staff(db: AsyncSession, user_id: str, course_id: str, user_role: UserRole) -> None:
    if user_role in (UserRole.ADMIN, UserRole.INSTRUCTOR):
        return
    result = await db.execute(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))
    if result.scalar_one_or_none() is None:
        raise AuthorizationError("Debes estar inscrito en el curso para acceder a este contenido")
