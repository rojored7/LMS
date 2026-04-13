from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user, require_instructor
from app.models.user import User
from app.schemas.common import ApiResponse, PaginationMeta
from app.schemas.course import (
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
    EnrollmentResponse,
    ModuleResponse,
)
from app.services.course_service import CourseService

router = APIRouter(prefix="/api/courses", tags=["courses"])


def _course_to_response(course, enrollment_count: int = 0, is_enrolled: bool = False) -> dict:
    modules = []
    if hasattr(course, "modules") and course.modules:
        for m in course.modules:
            lessons = []
            if hasattr(m, "lessons") and m.lessons:
                from app.schemas.course import LessonResponse
                lessons = [LessonResponse.model_validate(l).model_dump() for l in m.lessons]
            mod = ModuleResponse.model_validate(m).model_dump()
            mod["lessons"] = lessons
            modules.append(mod)

    resp = CourseResponse.model_validate(course).model_dump()
    resp["modules"] = modules
    resp["enrollmentCount"] = enrollment_count
    resp["isEnrolled"] = is_enrolled
    return resp


def _course_to_list_response(item: dict) -> dict:
    course = item["course"]
    resp = CourseListResponse.model_validate(course).model_dump()
    resp["enrollmentCount"] = item.get("enrollment_count", 0)
    resp["isEnrolled"] = item.get("is_enrolled", False)
    resp["moduleCount"] = item.get("module_count", 0)
    return resp


@router.get("")
async def list_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    level: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    service = CourseService(db)
    result = await service.list_courses(
        page=page,
        limit=limit,
        search=search,
        level=level,
        published_only=True,
        user_id=user.id if user else None,
    )
    courses = [_course_to_list_response(item) for item in result["courses"]]
    return ApiResponse(
        success=True,
        data=courses,
        meta=PaginationMeta(total=result["total"], page=result["page"], limit=result["limit"], pages=result["pages"]),
    ).model_dump()


@router.get("/enrolled")
async def get_enrolled_courses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CourseService(db)
    items = await service.get_enrolled_courses(user.id)
    courses = [_course_to_list_response(item) for item in items]
    return ApiResponse(success=True, data=courses).model_dump()


@router.get("/{id_or_slug}")
async def get_course(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    service = CourseService(db)
    course = await service.get_by_id_or_slug(id_or_slug, load_modules=True)
    enrollment_count = await service.get_enrollment_count(course.id)
    is_enrolled = False
    if user:
        is_enrolled = await service.is_user_enrolled(user.id, course.id)
    resp = _course_to_response(course, enrollment_count, is_enrolled)
    return ApiResponse(success=True, data=resp).model_dump()


@router.post("")
async def create_course(
    body: CourseCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = CourseService(db)
    data = body.model_dump(by_alias=False, exclude_unset=True)
    if not data.get("instructor_id"):
        data["instructor_id"] = user.id
    course = await service.create(data)
    return ApiResponse(success=True, data=_course_to_response(course)).model_dump()


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    body: CourseUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = CourseService(db)
    data = body.model_dump(by_alias=False, exclude_unset=True)
    course = await service.update(course_id, data)
    return ApiResponse(success=True, data=_course_to_response(course)).model_dump()


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = CourseService(db)
    await service.delete(course_id)
    return ApiResponse(success=True, data={"message": "Curso eliminado"}).model_dump()


@router.post("/{id_or_slug}/enroll")
async def enroll_in_course(
    id_or_slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CourseService(db)
    course = await service.get_by_id_or_slug(id_or_slug)
    enrollment = await service.enroll_user(user.id, course.id)
    return ApiResponse(success=True, data=EnrollmentResponse.model_validate(enrollment).model_dump()).model_dump()
