from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_instructor
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.quiz import (
    QuestionCreate,
    QuestionUpdate,
    QuizAttemptRequest,
    QuizCreate,
    QuizResponse,
    QuizUpdate,
)
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.get("/module/{module_id}")
async def list_quizzes(
    module_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    quizzes = await service.list_by_module(module_id)
    data = [QuizResponse.model_validate(q).model_dump() for q in quizzes]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    quiz = await service.get_by_id(quiz_id)
    return ApiResponse(success=True, data=QuizResponse.model_validate(quiz).model_dump()).model_dump()


@router.post("/module/{module_id}")
async def create_quiz(
    module_id: str,
    body: QuizCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    data = body.model_dump()
    quiz = await service.create(module_id, data)
    return ApiResponse(success=True, data=QuizResponse.model_validate(quiz).model_dump()).model_dump()


@router.put("/{quiz_id}")
async def update_quiz(
    quiz_id: str,
    body: QuizUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    quiz = await service.update(quiz_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=QuizResponse.model_validate(quiz).model_dump()).model_dump()


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    await service.delete(quiz_id)
    return ApiResponse(success=True, data={"message": "Quiz eliminado"}).model_dump()


@router.post("/{quiz_id}/attempt")
async def submit_attempt(
    quiz_id: str,
    body: QuizAttemptRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    result = await service.submit_attempt(quiz_id, user.id, body.answers)
    return ApiResponse(success=True, data=result).model_dump()


@router.post("/{quiz_id}/questions")
async def add_question(
    quiz_id: str,
    body: QuestionCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    question = await service.add_question(quiz_id, body.model_dump())
    return ApiResponse(success=True, data={"id": question.id, "text": question.text}).model_dump()


@router.put("/questions/{question_id}")
async def update_question(
    question_id: str,
    body: QuestionUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    question = await service.update_question(question_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data={"id": question.id, "text": question.text}).model_dump()


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = QuizService(db)
    await service.delete_question(question_id)
    return ApiResponse(success=True, data={"message": "Pregunta eliminada"}).model_dump()
