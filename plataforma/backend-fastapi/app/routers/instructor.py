from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database import get_db
from app.middleware.auth import require_instructor
from app.models.user import User, UserRole
from app.services.instructor_service import InstructorService

logger = structlog.get_logger()

router = APIRouter(prefix="/api/instructor", tags=["instructor"])


@router.get("/dashboard")
async def get_instructor_dashboard(
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = InstructorService(db)
    author_id = None if user.role == UserRole.ADMIN else user.id
    if author_id is None:
        author_id = user.id
    stats = await service.get_dashboard_stats(author_id)
    logger.info("instructor_dashboard_viewed", user_id=user.id)
    return {"success": True, "data": stats}


@router.get("/courses")
async def get_instructor_courses(
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = InstructorService(db)
    courses = await service.get_instructor_courses(user.id)
    return {"success": True, "data": courses}


@router.get("/courses/{course_id}/students")
async def get_course_students(
    course_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = InstructorService(db)
    students = await service.get_course_students(course_id, user.id)
    return {"success": True, "data": students}


@router.get("/courses/{course_id}/gradebook")
async def get_gradebook(
    course_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = InstructorService(db)
    gradebook = await service.get_gradebook(course_id, user.id)
    return {"success": True, "data": gradebook}


@router.get("/analytics")
async def get_instructor_analytics(
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = InstructorService(db)
    analytics = await service.get_instructor_analytics(user.id)
    return {"success": True, "data": analytics}
