import json

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import NotFoundError, ValidationError
from app.models.assessment import Question, Quiz
from app.models.progress import UserProgress

logger = structlog.get_logger()


class QuizService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, quiz_id: str, load_questions: bool = True) -> Quiz:
        query = select(Quiz).where(Quiz.id == quiz_id)
        if load_questions:
            query = query.options(selectinload(Quiz.questions))
        result = await self.db.execute(query)
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise NotFoundError("Quiz no encontrado")
        return quiz

    async def list_by_module(self, module_id: str) -> list[Quiz]:
        result = await self.db.execute(
            select(Quiz).where(Quiz.module_id == module_id).options(selectinload(Quiz.questions))
        )
        return list(result.scalars().all())

    async def create(self, module_id: str, data: dict) -> Quiz:
        questions_data = data.pop("questions", [])
        quiz = Quiz(module_id=module_id, **data)
        self.db.add(quiz)
        await self.db.flush()

        for q_data in questions_data:
            question = Question(quiz_id=quiz.id, **q_data)
            self.db.add(question)

        await self.db.flush()
        return await self.get_by_id(quiz.id)

    async def update(self, quiz_id: str, data: dict) -> Quiz:
        quiz = await self.get_by_id(quiz_id, load_questions=False)
        for key, value in data.items():
            if value is not None and hasattr(quiz, key):
                setattr(quiz, key, value)
        await self.db.flush()
        return await self.get_by_id(quiz.id)

    async def delete(self, quiz_id: str) -> None:
        quiz = await self.get_by_id(quiz_id, load_questions=False)
        await self.db.delete(quiz)
        await self.db.flush()
        logger.info("quiz_deleted", quiz_id=quiz_id)

    async def submit_attempt(self, quiz_id: str, user_id: str, answers: dict[str, str]) -> dict:
        quiz = await self.get_by_id(quiz_id)

        progress_result = await self.db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.module_id == quiz.module_id,
            )
        )
        progress = progress_result.scalar_one_or_none()
        current_attempts = progress.quiz_attempts if progress else 0

        if current_attempts >= quiz.max_attempts:
            raise ValidationError(f"Has alcanzado el maximo de intentos ({quiz.max_attempts})")

        total_points = 0
        earned_points = 0
        correct_count = 0

        for question in quiz.questions:
            total_points += question.points
            user_answer = answers.get(question.id, "").strip().lower()
            correct = question.correct_answer.strip().lower()
            if user_answer == correct:
                earned_points += question.points
                correct_count += 1

        score = round((earned_points / total_points) * 100, 2) if total_points > 0 else 0.0
        passed = score >= quiz.passing_score
        attempt_number = current_attempts + 1

        if not progress:
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            progress = await ps.get_or_create_progress(user_id, quiz.module_id)

        progress.quiz_score = score
        progress.quiz_attempts = attempt_number
        await self.db.flush()

        return {
            "score": score,
            "passed": passed,
            "totalQuestions": len(quiz.questions),
            "correctAnswers": correct_count,
            "attemptNumber": attempt_number,
            "maxAttempts": quiz.max_attempts,
        }

    async def add_question(self, quiz_id: str, data: dict) -> Question:
        await self.get_by_id(quiz_id, load_questions=False)
        question = Question(quiz_id=quiz_id, **data)
        self.db.add(question)
        await self.db.flush()
        return question

    async def update_question(self, question_id: str, data: dict) -> Question:
        result = await self.db.execute(select(Question).where(Question.id == question_id))
        question = result.scalar_one_or_none()
        if not question:
            raise NotFoundError("Pregunta no encontrada")
        for key, value in data.items():
            if value is not None and hasattr(question, key):
                setattr(question, key, value)
        await self.db.flush()
        return question

    async def delete_question(self, question_id: str) -> None:
        result = await self.db.execute(select(Question).where(Question.id == question_id))
        question = result.scalar_one_or_none()
        if not question:
            raise NotFoundError("Pregunta no encontrada")
        await self.db.delete(question)
        await self.db.flush()
