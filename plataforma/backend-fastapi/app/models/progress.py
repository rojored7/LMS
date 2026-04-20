import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import gen_id as _gen_id, utcnow as _utcnow


class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    certificate: Mapped[str | None] = mapped_column(String(32), nullable=True)

    user: Mapped["User"] = relationship(back_populates="enrollments")  # type: ignore[name-defined]
    course: Mapped["Course"] = relationship(back_populates="enrollments")  # type: ignore[name-defined]
    user_progress: Mapped[list["UserProgress"]] = relationship(back_populates="enrollment")

    __table_args__ = (
        Index("ix_enrollments_user_id", "user_id"),
        Index("ix_enrollments_course_id", "course_id"),
        UniqueConstraint("user_id", "course_id", name="uq_enrollments_user_course"),
    )


class UserProgress(Base):
    __tablename__ = "user_progress"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrollment_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=True)
    module_id: Mapped[str] = mapped_column(String(32), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True)
    status: Mapped[ProgressStatus] = mapped_column(SAEnum(ProgressStatus, create_constraint=False, native_enum=False), default=ProgressStatus.NOT_STARTED, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    time_spent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_access: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="user_progress")  # type: ignore[name-defined]
    enrollment: Mapped["Enrollment | None"] = relationship(back_populates="user_progress")
    module: Mapped["Module"] = relationship(back_populates="user_progress")  # type: ignore[name-defined]
    lesson: Mapped["Lesson | None"] = relationship(back_populates="user_progress")  # type: ignore[name-defined]

    __table_args__ = (
        Index("ix_user_progress_user_id", "user_id"),
        Index("ix_user_progress_module_id", "module_id"),
        Index("ix_user_progress_user_module_lesson", "user_id", "module_id", "lesson_id"),
        UniqueConstraint("user_id", "module_id", "lesson_id", name="uq_user_progress_user_module_lesson"),
    )
