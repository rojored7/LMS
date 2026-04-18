import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import gen_id as _gen_id, utcnow as _utcnow


class NotificationType(str, enum.Enum):
    BADGE_AWARDED = "BADGE_AWARDED"
    COURSE_COMPLETED = "COURSE_COMPLETED"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"
    QUIZ_PASSED = "QUIZ_PASSED"
    LAB_PASSED = "LAB_PASSED"
    PROJECT_GRADED = "PROJECT_GRADED"
    COURSE_ASSIGNED = "COURSE_ASSIGNED"
    ACHIEVEMENT = "ACHIEVEMENT"
    COURSE = "COURSE"
    REMINDER = "REMINDER"


class Badge(Base):
    __tablename__ = "badges"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    course_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(255), default="platform", nullable=False)
    is_external: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    requirement: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user_badges: Mapped[list["UserBadge"]] = relationship(back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id: Mapped[str] = mapped_column(String(32), ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    enrolled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    course_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    certificate_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship(back_populates="user_badges")
    badge: Mapped[Badge] = relationship(back_populates="user_badges")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )


class Certificate(Base):
    __tablename__ = "certificates"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    certificate_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    verification_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="certificates")
    course: Mapped["Course"] = relationship(back_populates="certificates")


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(SAEnum(NotificationType, create_constraint=False, native_enum=False), nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_user_read", "user_id", "read"),
        Index("ix_notifications_created_at", "created_at"),
    )
