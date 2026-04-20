from datetime import datetime, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import NotFoundError, ValidationError
from app.models.assessment import Question, Quiz, QuizAttempt
from app.models.progress import UserProgress
from app.services.scoring import calculate_quiz_score

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
        attempt_number = await self._check_attempts_limit(quiz_id, user_id, quiz.attempts)

        correct_count, total_questions = calculate_quiz_score(quiz.questions, answers)
        score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
        passed = score >= quiz.passing_score

        await self._store_attempt(quiz_id, user_id, answers, score, passed)

        if passed:
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps.recalculate_course_progress(user_id, quiz.module_id)

        return {
            "score": score,
            "passed": passed,
            "totalQuestions": total_questions,
            "correctAnswers": correct_count,
            "attemptNumber": attempt_number,
            "maxAttempts": quiz.attempts,
        }

    async def _check_attempts_limit(self, quiz_id: str, user_id: str, max_attempts: int) -> int:
        count_result = await self.db.execute(
            select(func.count()).select_from(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user_id,
            )
        )
        current = count_result.scalar() or 0
        if current >= max_attempts:
            raise ValidationError(f"Has alcanzado el maximo de intentos ({max_attempts})")
        return current + 1

    async def _store_attempt(self, quiz_id: str, user_id: str, answers: dict, score: int, passed: bool) -> None:
        attempt = QuizAttempt(
            quiz_id=quiz_id, user_id=user_id, answers=answers, score=score, passed=passed,
            started_at=datetime.now(timezone.utc), completed_at=datetime.now(timezone.utc),
        )
        self.db.add(attempt)
        await self.db.flush()

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
