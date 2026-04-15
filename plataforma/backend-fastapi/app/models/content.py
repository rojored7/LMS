from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, Integer, JSON, String, Text
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import gen_id as _gen_id, utcnow as _utcnow


class Translation(Base):
    __tablename__ = "translations"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(32), nullable=False)
    field: Mapped[str] = mapped_column(String(100), nullable=False)
    locale: Mapped[str] = mapped_column(String(10), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_translations_lookup", "entity_type", "entity_id", "field", "locale"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="chat_messages")


class ScormPackage(Base):
    __tablename__ = "scorm_packages"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    course_id: Mapped[str] = mapped_column(String(32), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.2", nullable=False)
    manifest: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    files: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    uploaded_by: Mapped[str | None] = mapped_column(String(32), nullable=True)

    course: Mapped["Course"] = relationship(back_populates="scorm_packages")  # type: ignore[name-defined]


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_gen_id)
    user_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
