from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.permissions import Permission, require_permission
from app.schemas.common import ApiResponse, CamelModel
from app.services.training_profile_service import TrainingProfileService

router = APIRouter(prefix="/api/training-profiles", tags=["training-profiles"])


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

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


class UpdateCourseRequest(BaseModel):
    order: int | None = None
    required: bool | None = None


class CourseOrderItem(BaseModel):
    course_id: str
    order: int


class ReorderCoursesRequest(BaseModel):
    courses: list[CourseOrderItem]


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CourseInProfileResponse(CamelModel):
    id: str
    title: str
    slug: str
    level: str
    order: int
    required: bool


class TrainingProfileResponse(CamelModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str | None = None
    color: str | None = None
    courses: list[CourseInProfileResponse] = []


def _build_profile_response(profile) -> dict:
    courses = []
    for cp in sorted(profile.course_profiles, key=lambda x: x.order):
        if cp.course:
            courses.append(
                CourseInProfileResponse(
                    id=cp.course.id,
                    title=cp.course.title,
                    slug=cp.course.slug,
                    level=cp.course.level.value if hasattr(cp.course.level, "value") else str(cp.course.level),
                    order=cp.order,
                    required=cp.required,
                ).model_dump()
            )
    data = TrainingProfileResponse.model_validate(profile).model_dump()
    data["courses"] = courses
    return data


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def list_profiles(
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profiles = await service.list_profiles()
    data = [_build_profile_response(p) for p in profiles]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{profile_id}")
async def get_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.get_by_id(profile_id)
    return ApiResponse(success=True, data=_build_profile_response(profile)).model_dump()


@router.get("/slug/{slug}")
async def get_profile_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    profile = await service.get_by_slug(slug)
    return ApiResponse(success=True, data=_build_profile_response(profile)).model_dump()


@router.post("")
async def create_profile(
    body: TrainingProfileCreate,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    created = await service.create(body.model_dump())
    profile = await service.get_by_id(created.id)
    return ApiResponse(success=True, data=_build_profile_response(profile)).model_dump()


@router.put("/{profile_id}")
async def update_profile(
    profile_id: str,
    body: TrainingProfileUpdate,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.update(profile_id, body.model_dump(exclude_unset=True))
    profile = await service.get_by_id(profile_id)
    return ApiResponse(success=True, data=_build_profile_response(profile)).model_dump()


@router.delete("/{profile_id}")
async def delete_profile(
    profile_id: str,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.delete(profile_id)
    return ApiResponse(success=True, data={"message": "Perfil eliminado"}).model_dump()


@router.post("/{profile_id}/courses")
async def add_course_to_profile(
    profile_id: str,
    body: AddCourseRequest,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    cp = await service.add_course(profile_id, body.course_id, body.order)
    return ApiResponse(
        success=True,
        data={"profileId": cp.profile_id, "courseId": cp.course_id, "order": cp.order, "required": cp.required},
    ).model_dump()


# IMPORTANTE: reorder debe declararse ANTES que /{course_id} para evitar
# que FastAPI interprete el literal "reorder" como un course_id.
@router.patch("/{profile_id}/courses/reorder")
async def reorder_courses_in_profile(
    profile_id: str,
    body: ReorderCoursesRequest,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.reorder_courses(
        profile_id,
        [{"course_id": item.course_id, "order": item.order} for item in body.courses],
    )
    return ApiResponse(success=True, data={"message": "Cursos reordenados"}).model_dump()


@router.patch("/{profile_id}/courses/{course_id}")
async def update_course_in_profile(
    profile_id: str,
    course_id: str,
    body: UpdateCourseRequest,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    cp = await service.update_course(
        profile_id,
        course_id,
        body.model_dump(exclude_unset=True),
    )
    return ApiResponse(
        success=True,
        data={"profileId": cp.profile_id, "courseId": cp.course_id, "order": cp.order, "required": cp.required},
    ).model_dump()


@router.delete("/{profile_id}/courses/{course_id}")
async def remove_course_from_profile(
    profile_id: str,
    course_id: str,
    user: User = Depends(require_permission(Permission.TRAINING_PROFILE_WRITE)),
    db: AsyncSession = Depends(get_db),
):
    service = TrainingProfileService(db)
    await service.remove_course(profile_id, course_id)
    return ApiResponse(success=True, data={"message": "Curso removido del perfil"}).model_dump()
