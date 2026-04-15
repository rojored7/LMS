from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.error_handler import NotFoundError
from app.models.course import Course
from app.models.progress import UserProgress
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/api/progress", tags=["progress"])


async def _resolve_course_id(db: AsyncSession, course_id_or_slug: str) -> str:
    """Resolve a course ID or slug to the actual course ID."""
    result = await db.execute(
        select(Course.id).where((Course.id == course_id_or_slug) | (Course.slug == course_id_or_slug))
    )
    course_id = result.scalar_one_or_none()
    if course_id is None:
        raise NotFoundError("Curso no encontrado")
    return course_id


@router.get("/course/{course_id}")
async def get_course_progress(
    course_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resolved_id = await _resolve_course_id(db, course_id)
    service = ProgressService(db)
    progress = await service.get_detailed_course_progress(user.id, resolved_id)
    return ApiResponse(success=True, data=progress).model_dump()


@router.get("/detailed")
async def get_detailed_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProgressService(db)
    detailed = await service.get_detailed_progress(user.id)
    return ApiResponse(success=True, data=detailed).model_dump()


@router.get("/module/{module_id}")
async def get_module_progress(
    module_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProgressService(db)
    data = await service.get_module_progress(user.id, module_id)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/study-hours")
async def get_study_hours(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_seconds = (await db.execute(
        select(func.coalesce(func.sum(UserProgress.time_spent), 0)).where(
            UserProgress.user_id == user.id
        )
    )).scalar() or 0
    hours = round(total_seconds / 3600, 1)
    return ApiResponse(success=True, data={"totalSeconds": total_seconds, "hours": hours}).model_dump()
