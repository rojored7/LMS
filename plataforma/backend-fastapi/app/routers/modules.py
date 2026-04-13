from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.course import ModuleResponse, LessonResponse
from app.services.module_service import ModuleService
from app.utils.enrollment_check import verify_enrollment_or_staff

router = APIRouter(prefix="/api/modules", tags=["modules"])


@router.get("/{module_id}")
async def get_module(module_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = ModuleService(db)
    module = await service.get_by_id(module_id, load_lessons=True)
    await verify_enrollment_or_staff(db, user.id, module.course_id, user.role)
    return {"success": True, "data": ModuleResponse.model_validate(module).model_dump()}


@router.get("/{module_id}/lessons")
async def get_module_lessons(module_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = ModuleService(db)
    module = await service.get_by_id(module_id, load_lessons=True)
    await verify_enrollment_or_staff(db, user.id, module.course_id, user.role)
    lessons = module.lessons if module.lessons else []
    return {"success": True, "data": [LessonResponse.model_validate(l).model_dump() for l in lessons]}


@router.get("/{module_id}/progress")
async def get_module_progress(module_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    from app.services.progress_service import ProgressService
    service = ModuleService(db)
    module = await service.get_by_id(module_id)
    await verify_enrollment_or_staff(db, user.id, module.course_id, user.role)
    progress_service = ProgressService(db)
    progress = await progress_service.get_module_progress(user.id, module_id)
    return {"success": True, "data": progress}
