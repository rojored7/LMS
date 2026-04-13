from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import CamelModel


class QuestionCreate(BaseModel):
    text: str = Field(min_length=3)
    type: str = "MULTIPLE_CHOICE"
    options: str | None = None
    correct_answer: str
    explanation: str | None = None
    points: int = 1
    order: int = 0


class QuestionUpdate(BaseModel):
    text: str | None = None
    type: str | None = None
    options: str | None = None
    correct_answer: str | None = None
    explanation: str | None = None
    points: int | None = None
    order: int | None = None


class QuizCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    passing_score: int = 70
    max_attempts: int = 3
    time_limit_minutes: int | None = None
    questions: list[QuestionCreate] = []


class QuizUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    passing_score: int | None = None
    max_attempts: int | None = None
    time_limit_minutes: int | None = None


class QuizAttemptRequest(BaseModel):
    answers: dict[str, str]


class QuestionResponse(CamelModel):
    id: str
    text: str
    type: str
    options: str | None = None
    explanation: str | None = None
    points: int
    order: int


class QuizResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    passing_score: int
    max_attempts: int
    time_limit_minutes: int | None = None
    module_id: str
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionResponse] = []


class QuizAttemptResponse(CamelModel):
    score: float
    passed: bool
    total_questions: int
    correct_answers: int
    attempt_number: int
    max_attempts: int
