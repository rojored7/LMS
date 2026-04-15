import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import gen_id as _gen_id, utcnow as _utcnow


class CourseLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class LessonType(str, enum.Enum):
    TEXT = "TEXT"
    VIDEO = "VIDEO"
    INTERACTIVE = "INTERACTIVE"
    READING = "READING"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[CourseLevel] = mapped_column(SAEnum(CourseLevel), nullable=False)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    author_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    modules: Mapped[list["Module"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    course_profiles: Mapped[list["CourseProfile"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course", cascade="all, delete-orphan")  # type: ignore[name-defined]
    projects: Mapped[list["Project"]] = relationship(back_populates="course", cascade="all, delete-orphan")  # type: ignore[name-defined]
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="course", cascade="all, delete-orphan")  # type: ignore[name-defined]
    scorm_packages: Mapped[list["ScormPackage"]] = relationship(back_populates="course", cascade="all, delete-orphan")  # type: ignore[name-defined]

    __table_args__ = (
        Index("ix_courses_slug", "slug"),
        Index("ix_courses_is_published", "is_published"),
        Index("ix_courses_level", "level"),
    )


class CourseProfile(Base):
    __tablename__ = "course_profiles"

    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    profile_id: Mapped[str] = mapped_column(String(32), ForeignKey("training_profiles.id", ondelete="CASCADE"), primary_key=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    course: Mapped[Course] = relationship(back_populates="course_profiles")
    profile: Mapped["TrainingProfile"] = relationship(back_populates="course_profiles")  # type: ignore[name-defined]

    __table_args__ = (
        Index("ix_course_profiles_profile_id", "profile_id"),
    )


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="module", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="module", cascade="all, delete-orphan")  # type: ignore[name-defined]
    labs: Mapped[list["Lab"]] = relationship(back_populates="module", cascade="all, delete-orphan")  # type: ignore[name-defined]
    user_progress: Mapped[list["UserProgress"]] = relationship(back_populates="module", cascade="all, delete-orphan")  # type: ignore[name-defined]

    __table_args__ = (
        Index("ix_modules_course_id", "course_id"),
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    module_id: Mapped[str] = mapped_column(String(32), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[LessonType] = mapped_column(SAEnum(LessonType), default=LessonType.TEXT, nullable=False)
    estimated_time: Mapped[int] = mapped_column(Integer, nullable=False)

    module: Mapped[Module] = relationship(back_populates="lessons")
    user_progress: Mapped[list["UserProgress"]] = relationship(back_populates="lesson")  # type: ignore[name-defined]

    __table_args__ = (
        Index("ix_lessons_module_id", "module_id"),
    )
