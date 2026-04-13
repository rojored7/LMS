from pydantic import BaseModel, Field

from app.schemas.common import CamelModel


class QuestionCreate(BaseModel):
    question: str = Field(min_length=3)
    type: str = "MULTIPLE_CHOICE"
    options: list[str] | None = None
    correct_answer: str | int | list | dict | None = None
    explanation: str | None = None
    order: int = 0


class QuestionUpdate(BaseModel):
    question: str | None = None
    type: str | None = None
    options: list[str] | None = None
    correct_answer: str | int | list | dict | None = None
    explanation: str | None = None
    order: int | None = None


class QuizCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    description: str | None = None
    passing_score: int = 70
    attempts: int = 3
    time_limit: int | None = None
    questions: list[QuestionCreate] = []


class QuizUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    passing_score: int | None = None
    attempts: int | None = None
    time_limit: int | None = None


class QuizAttemptRequest(BaseModel):
    answers: dict[str, str]


class QuestionResponse(CamelModel):
    id: str
    question: str
    type: str
    options: list[str] | dict | None = None
    correct_answer: str | int | list | dict | None = None
    explanation: str | None = None
    order: int = 0


class QuizResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    passing_score: int = 70
    attempts: int = 3
    time_limit: int | None = None
    module_id: str
    questions: list[QuestionResponse] = []


class QuizAttemptResponse(CamelModel):
    score: float
    passed: bool
    total_questions: int
    correct_answers: int
    attempt_number: int
    max_attempts: int
