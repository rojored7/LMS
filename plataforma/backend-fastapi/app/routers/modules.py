from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_instructor
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.course import ModuleCreate, ModuleResponse, ModuleUpdate
from app.services.module_service import ModuleService

router = APIRouter(prefix="/api/modules", tags=["modules"])


class ReorderRequest(BaseModel):
    module_ids: list[str]


@router.get("/course/{course_id}")
async def list_modules(
    course_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    modules = await service.list_by_course(course_id)
    data = [ModuleResponse.model_validate(m).model_dump() for m in modules]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{module_id}")
async def get_module(
    module_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    module = await service.get_by_id(module_id, load_lessons=True)
    return ApiResponse(success=True, data=ModuleResponse.model_validate(module).model_dump()).model_dump()


@router.post("/course/{course_id}")
async def create_module(
    course_id: str,
    body: ModuleCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    module = await service.create(course_id, body.model_dump())
    return ApiResponse(success=True, data=ModuleResponse.model_validate(module).model_dump()).model_dump()


@router.put("/{module_id}")
async def update_module(
    module_id: str,
    body: ModuleUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    module = await service.update(module_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=ModuleResponse.model_validate(module).model_dump()).model_dump()


@router.delete("/{module_id}")
async def delete_module(
    module_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    await service.delete(module_id)
    return ApiResponse(success=True, data={"message": "Modulo eliminado"}).model_dump()


@router.post("/course/{course_id}/reorder")
async def reorder_modules(
    course_id: str,
    body: ReorderRequest,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ModuleService(db)
    modules = await service.reorder(course_id, body.module_ids)
    data = [ModuleResponse.model_validate(m).model_dump() for m in modules]
    return ApiResponse(success=True, data=data).model_dump()
