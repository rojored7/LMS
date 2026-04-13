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
        from app.models.assessment import QuizAttempt
        quiz = await self.get_by_id(quiz_id)

        # Count previous attempts from QuizAttempt table
        attempt_count_result = await self.db.execute(
            select(func.count()).select_from(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == user_id,
            )
        )
        current_attempts = attempt_count_result.scalar() or 0

        if current_attempts >= quiz.attempts:
            raise ValidationError(f"Has alcanzado el maximo de intentos ({quiz.attempts})")

        total_questions = len(quiz.questions)
        correct_count = 0

        for question in quiz.questions:
            user_answer = answers.get(question.id, "").strip().lower()
            correct = question.correct_answer
            opts = question.options if isinstance(question.options, list) else []

            if isinstance(correct, int):
                # correct_answer is an index into options list
                if 0 <= correct < len(opts):
                    correct_text = str(opts[correct]).strip().lower()
                    if user_answer == correct_text:
                        correct_count += 1
            elif isinstance(correct, str):
                # Try direct string match first
                if user_answer == correct.strip().lower():
                    correct_count += 1
                # Also try as index string (e.g., "1")
                elif correct.isdigit():
                    idx = int(correct)
                    if 0 <= idx < len(opts) and user_answer == str(opts[idx]).strip().lower():
                        correct_count += 1
            elif isinstance(correct, dict):
                answer_val = correct.get("value", correct)
                if user_answer == str(answer_val).strip().lower():
                    correct_count += 1
            elif isinstance(correct, list):
                user_list = answers.get(question.id)
                if isinstance(user_list, list) and sorted(str(a).lower() for a in user_list) == sorted(str(e).lower() for e in correct):
                    correct_count += 1

        score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
        passed = score >= quiz.passing_score
        attempt_number = current_attempts + 1

        # Store attempt in QuizAttempt
        from datetime import datetime, timezone
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            answers=answers,
            score=score,
            passed=passed,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
        )
        self.db.add(attempt)
        await self.db.flush()

        # Recalculate progress if passed
        if passed:
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps._recalculate_course_progress(user_id, quiz.module_id)

        return {
            "score": score,
            "passed": passed,
            "totalQuestions": total_questions,
            "correctAnswers": correct_count,
            "attemptNumber": attempt_number,
            "maxAttempts": quiz.attempts,
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
