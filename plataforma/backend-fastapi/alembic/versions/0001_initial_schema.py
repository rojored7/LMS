"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-04-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crear todas las tablas del schema inicial.

    Usa create_all para crear tablas que no existan.
    Si las tablas ya existen (ej: creadas por Base.metadata.create_all),
    checkfirst=True evita errores.
    """
    from app.database import Base
    from app.models.user import User, TrainingProfile, RefreshToken, PasswordResetToken
    from app.models.course import Course, Module, Lesson, CourseProfile
    from app.models.progress import Enrollment, UserProgress
    from app.models.assessment import Quiz, Question, QuizAttempt, Lab, LabSubmission, Project, ProjectSubmission
    from app.models.gamification import Badge, UserBadge, Certificate, Notification
    from app.models.content import Translation, ChatMessage, ScormPackage, AuditLog

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    """Eliminar todas las tablas."""
    from app.database import Base
    from app.models.user import User, TrainingProfile, RefreshToken, PasswordResetToken
    from app.models.course import Course, Module, Lesson, CourseProfile
    from app.models.progress import Enrollment, UserProgress
    from app.models.assessment import Quiz, Question, QuizAttempt, Lab, LabSubmission, Project, ProjectSubmission
    from app.models.gamification import Badge, UserBadge, Certificate, Notification
    from app.models.content import Translation, ChatMessage, ScormPackage, AuditLog

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)
