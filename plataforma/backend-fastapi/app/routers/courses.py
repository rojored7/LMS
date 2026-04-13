import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user, require_admin, require_instructor
from app.models.user import User
from app.schemas.common import PaginationMeta
from app.schemas.course import CourseCreate, CourseListResponse, CourseResponse, CourseUpdate, EnrollmentResponse, ModuleResponse, LessonResponse
from app.services.course_service import CourseService

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("")
async def list_courses(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100), level: str | None = None, search: str | None = None, db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    courses, total = await service.get_published_courses(page, limit, level, search)
    return {"success": True, "data": [CourseListResponse.model_validate(c).model_dump() for c in courses], "meta": PaginationMeta(total=total, page=page, limit=limit, pages=math.ceil(total / limit)).model_dump()}


@router.get("/enrolled")
async def get_my_enrollments(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    enrollments = await service.get_user_enrollments(user.id)
    return {"success": True, "data": [EnrollmentResponse.model_validate(e).model_dump() for e in enrollments]}


@router.get("/search")
async def search_courses(q: str = "", db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    courses, total = await service.get_published_courses(search=q)
    return {"success": True, "data": [CourseListResponse.model_validate(c).model_dump() for c in courses]}


@router.get("/{id_or_slug}")
async def get_course(id_or_slug: str, user: User | None = Depends(get_optional_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    course = await service.get_course_by_id_or_slug(id_or_slug)
    data = CourseResponse.model_validate(course).model_dump()
    if user:
        data["isEnrolled"] = await service.is_user_enrolled(user.id, course.id)
    else:
        data["isEnrolled"] = False
    return {"success": True, "data": data}


@router.post("")
async def create_course(data: CourseCreate, user: User = Depends(require_instructor), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    course = await service.create_course(slug=data.slug, title=data.title, description=data.description, duration=data.duration, level=data.level, author=data.author, tags=data.tags, thumbnail=data.thumbnail, price=data.price)
    return {"success": True, "data": CourseResponse.model_validate(course).model_dump()}


@router.put("/{course_id}")
async def update_course(course_id: str, data: CourseUpdate, user: User = Depends(require_instructor), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    course = await service.update_course(course_id, **data.model_dump(exclude_unset=True, by_alias=False))
    return {"success": True, "data": CourseResponse.model_validate(course).model_dump()}


@router.delete("/{course_id}")
async def delete_course(course_id: str, user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    await service.delete_course(course_id)
    return {"success": True, "data": {"message": "Curso eliminado"}}


@router.post("/{course_id}/enroll")
async def enroll_in_course(course_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    enrollment, is_new = await service.enroll_user(user.id, course_id)
    response_data = EnrollmentResponse.model_validate(enrollment).model_copy(update={"is_new": is_new}).model_dump()
    return {"success": True, "data": response_data}


@router.delete("/{course_id}/enroll")
async def unenroll_from_course(course_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    await service.unenroll_user(user.id, course_id)
    return {"success": True, "data": {"message": "Desinscripcion exitosa"}}


@router.get("/{course_id}/modules")
async def get_course_modules(course_id: str, user: User | None = Depends(get_optional_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    modules = await service.get_course_modules(course_id)
    return {"success": True, "data": [ModuleResponse.model_validate(m).model_dump() for m in modules]}


@router.get("/{course_id}/modules/{module_id}/lessons")
async def get_module_lessons(course_id: str, module_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = CourseService(db)
    lessons = await service.get_module_lessons(module_id, course_id=course_id)
    return {"success": True, "data": [LessonResponse.model_validate(l).model_dump() for l in lessons]}
