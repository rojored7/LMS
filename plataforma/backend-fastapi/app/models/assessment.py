import enum
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _gen_id() -> str:
    return uuid4().hex


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    MULTIPLE_SELECT = "MULTIPLE_SELECT"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"


class ProjectStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWING = "REVIEWING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Quiz(Base):
    __tablename__ = "quizzes"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    module_id: Mapped[str] = mapped_column(String(32), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    passing_score: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    time_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    module: Mapped["Module"] = relationship(back_populates="quizzes")  # type: ignore[name-defined]
    questions: Mapped[list["Question"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    __table_args__ = (Index("ix_quizzes_module_id", "module_id"),)


class Question(Base):
    __tablename__ = "questions"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    quiz_id: Mapped[str] = mapped_column(String(32), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[QuestionType] = mapped_column(SAEnum(QuestionType), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[dict | str | None] = mapped_column(JSON, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz: Mapped[Quiz] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id: Mapped[str] = mapped_column(String(32), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    answers: Mapped[dict] = mapped_column(JSON, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    quiz: Mapped[Quiz] = relationship(back_populates="quiz_attempts")
    __table_args__ = (Index("ix_quiz_attempts_user_id", "user_id"), Index("ix_quiz_attempts_quiz_id", "quiz_id"))


class Lab(Base):
    __tablename__ = "labs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    module_id: Mapped[str] = mapped_column(String(32), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    language: Mapped[str] = mapped_column(String(30), default="python", nullable=False)
    starter_code: Mapped[str] = mapped_column(Text, default="", nullable=False)
    solution: Mapped[str] = mapped_column(Text, default="", nullable=False)
    tests: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    hints: Mapped[list | None] = mapped_column(JSON, nullable=True)
    module: Mapped["Module"] = relationship(back_populates="labs")  # type: ignore[name-defined]
    submissions: Mapped[list["LabSubmission"]] = relationship(back_populates="lab", cascade="all, delete-orphan")
    __table_args__ = (Index("ix_labs_module_id", "module_id"),)


class LabSubmission(Base):
    __tablename__ = "lab_submissions"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lab_id: Mapped[str] = mapped_column(String(32), ForeignKey("labs.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(30), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stdout: Mapped[str] = mapped_column(Text, default="", nullable=False)
    stderr: Mapped[str] = mapped_column(Text, default="", nullable=False)
    exit_code: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    execution_time: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    lab: Mapped[Lab] = relationship(back_populates="submissions")
    __table_args__ = (Index("ix_lab_submissions_user_id", "user_id"), Index("ix_lab_submissions_lab_id", "lab_id"))


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    rubric: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    course: Mapped["Course"] = relationship(back_populates="projects")  # type: ignore[name-defined]
    submissions: Mapped[list["ProjectSubmission"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectSubmission(Base):
    __tablename__ = "project_submissions"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(32), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    files: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(SAEnum(ProjectStatus), default=ProjectStatus.PENDING, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    project: Mapped[Project] = relationship(back_populates="submissions")
    __table_args__ = (Index("ix_project_submissions_user_id", "user_id"),)
