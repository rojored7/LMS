from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.course import Lesson, Module
from app.models.user import User
from app.schemas.course import LessonResponse
from app.services.lesson_service import LessonService
from app.services.progress_service import ProgressService
from app.utils.enrollment_check import verify_enrollment_or_staff

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


async def _verify_lesson_enrollment(lesson: Lesson, user: User, db: AsyncSession) -> None:
    mod = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one()
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = LessonService(db)
    lesson = await service.get_lesson(lesson_id)
    await _verify_lesson_enrollment(lesson, user, db)
    data = LessonResponse.model_validate(lesson).model_dump()
    progress_service = ProgressService(db)
    user_progress = await progress_service.get_lesson_progress(user.id, lesson_id)
    data["userProgress"] = user_progress
    return {"success": True, "data": data}


@router.post("/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    lesson_service = LessonService(db)
    lesson = await lesson_service.get_lesson(lesson_id)
    await _verify_lesson_enrollment(lesson, user, db)
    service = ProgressService(db)
    progress = await service.mark_lesson_complete(user.id, lesson_id)
    return {"success": True, "data": {"completed": progress.completed, "completedAt": progress.completed_at.isoformat() if progress.completed_at else None, "progress": progress.progress}}


@router.get("/{lesson_id}/progress")
async def get_lesson_progress(lesson_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = LessonService(db)
    lesson = await service.get_lesson(lesson_id)
    await _verify_lesson_enrollment(lesson, user, db)
    progress = await service.get_lesson_progress(lesson_id, user.id)
    return {"success": True, "data": progress}


@router.get("/{lesson_id}/quiz")
async def get_lesson_quiz(lesson_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = LessonService(db)
    lesson = await service.get_lesson(lesson_id)
    await _verify_lesson_enrollment(lesson, user, db)
    quiz = await service.get_lesson_quiz(lesson_id)
    if quiz is None:
        return {"success": True, "data": None}
    return {"success": True, "data": {"id": quiz.id, "title": quiz.title, "description": quiz.description, "passingScore": quiz.passing_score, "timeLimit": quiz.time_limit, "attempts": quiz.attempts}}


@router.get("/{lesson_id}/lab")
async def get_lesson_lab(lesson_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    service = LessonService(db)
    lesson = await service.get_lesson(lesson_id)
    await _verify_lesson_enrollment(lesson, user, db)
    lab = await service.get_lesson_lab(lesson_id)
    if lab is None:
        return {"success": True, "data": None}
    return {"success": True, "data": {"id": lab.id, "title": lab.title, "description": lab.description, "language": lab.language, "starterCode": lab.starter_code}}
