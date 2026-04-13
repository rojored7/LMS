from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user, require_instructor
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.course import LessonCreate, LessonResponse, LessonUpdate
from app.services.lesson_service import LessonService
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("/module/{module_id}")
async def list_lessons(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    service = LessonService(db)
    lessons = await service.list_by_module(module_id)

    user_progress_map: dict[str, dict] = {}
    if user:
        progress_service = ProgressService(db)
        progress = await progress_service.get_or_create_progress(user.id, module_id)
        user_progress_map[module_id] = {
            "completedLessons": progress.completed_lessons,
            "totalLessons": progress.total_lessons,
        }

    data = []
    for lesson in lessons:
        resp = LessonResponse.model_validate(lesson).model_dump()
        resp["userProgress"] = user_progress_map.get(module_id)
        data.append(resp)

    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    service = LessonService(db)
    lesson = await service.get_by_id(lesson_id)
    resp = LessonResponse.model_validate(lesson).model_dump()

    if user:
        progress_service = ProgressService(db)
        progress = await progress_service.get_or_create_progress(user.id, lesson.module_id)
        resp["userProgress"] = {
            "completedLessons": progress.completed_lessons,
            "totalLessons": progress.total_lessons,
        }

    return ApiResponse(success=True, data=resp).model_dump()


@router.post("/module/{module_id}")
async def create_lesson(
    module_id: str,
    body: LessonCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LessonService(db)
    lesson = await service.create(module_id, body.model_dump())
    return ApiResponse(success=True, data=LessonResponse.model_validate(lesson).model_dump()).model_dump()


@router.put("/{lesson_id}")
async def update_lesson(
    lesson_id: str,
    body: LessonUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LessonService(db)
    lesson = await service.update(lesson_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=LessonResponse.model_validate(lesson).model_dump()).model_dump()


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LessonService(db)
    await service.delete(lesson_id)
    return ApiResponse(success=True, data={"message": "Leccion eliminada"}).model_dump()


@router.post("/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson_service = LessonService(db)
    lesson = await lesson_service.get_by_id(lesson_id)
    progress_service = ProgressService(db)
    progress = await progress_service.mark_lesson_complete(user.id, lesson.module_id, lesson.id)
    return ApiResponse(
        success=True,
        data={
            "completedLessons": progress.completed_lessons,
            "totalLessons": progress.total_lessons,
            "moduleCompleted": progress.completed_at is not None,
        },
    ).model_dump()
