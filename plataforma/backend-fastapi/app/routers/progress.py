from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/course/{course_id}")
async def get_course_progress(
    course_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProgressService(db)
    progress = await service.get_detailed_course_progress(user.id, course_id)
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
