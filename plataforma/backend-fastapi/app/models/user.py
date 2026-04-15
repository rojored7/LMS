import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import gen_id as _gen_id, utcnow as _utcnow


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    STUDENT = "STUDENT"


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    theme: Mapped[str] = mapped_column(String(20), default="system", nullable=False)
    locale: Mapped[str] = mapped_column(String(10), default="es", nullable=False)
    training_profile_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("training_profiles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_badges: Mapped[list["UserBadge"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    # TODO: Implementar servicio de chat - migrar desde Socket.IO Express
    chat_messages: Mapped[list["ChatMessage"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_progress: Mapped[list["UserProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    training_profile: Mapped["TrainingProfile | None"] = relationship(back_populates="users")

    __table_args__ = (Index("ix_users_email", "email"), Index("ix_users_role", "role"))


class TrainingProfile(Base):
    __tablename__ = "training_profiles"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    users: Mapped[list[User]] = relationship(back_populates="training_profile")
    course_profiles: Mapped[list["CourseProfile"]] = relationship(back_populates="profile")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    user: Mapped[User] = relationship(back_populates="refresh_tokens")
    __table_args__ = (Index("ix_refresh_tokens_user_id", "user_id"), Index("ix_refresh_tokens_token", "token"))


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    user: Mapped[User] = relationship(back_populates="password_reset_tokens")
