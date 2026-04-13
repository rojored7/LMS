from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.common import ApiResponse, CamelModel
from app.services.training_profile_service import TrainingProfileService

router = APIRouter(prefix="/api/training-profiles", tags=["training-profiles"])


class TrainingProfileCreate(BaseModel):
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None


class TrainingProfileUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None


class AddCourseRequest(BaseModel):
    course_id: str
    order: int = 0


class TrainingProfileResponse(CamelModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None


@router.get("")
async def list_profiles(
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profiles = await service.list_profiles()
    data = [TrainingProfileResponse.model_validate(p).model_dump() for p in profiles]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{profile_id}")
async def get_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.get_by_id(profile_id)
    return ApiResponse(success=True, data=TrainingProfileResponse.model_validate(profile).model_dump()).model_dump()


@router.get("/slug/{slug}")
async def get_profile_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.get_by_slug(slug)
    return ApiResponse(success=True, data=TrainingProfileResponse.model_validate(profile).model_dump()).model_dump()


@router.post("")
async def create_profile(
    body: TrainingProfileCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.create(body.model_dump())
    return ApiResponse(success=True, data=TrainingProfileResponse.model_validate(profile).model_dump()).model_dump()


@router.put("/{profile_id}")
async def update_profile(
    profile_id: str,
    body: TrainingProfileUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.update(profile_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=TrainingProfileResponse.model_validate(profile).model_dump()).model_dump()


@router.delete("/{profile_id}")
async def delete_profile(
    profile_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.delete(profile_id)
    return ApiResponse(success=True, data={"message": "Perfil eliminado"}).model_dump()


@router.post("/{profile_id}/courses")
async def add_course_to_profile(
    profile_id: str,
    body: AddCourseRequest,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    cp = await service.add_course(profile_id, body.course_id, body.order)
    return ApiResponse(success=True, data={"id": cp.id, "profileId": cp.profile_id, "courseId": cp.course_id, "order": cp.order}).model_dump()


@router.delete("/{profile_id}/courses/{course_id}")
async def remove_course_from_profile(
    profile_id: str,
    course_id: str,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.remove_course(profile_id, course_id)
    return ApiResponse(success=True, data={"message": "Curso removido del perfil"}).model_dump()
