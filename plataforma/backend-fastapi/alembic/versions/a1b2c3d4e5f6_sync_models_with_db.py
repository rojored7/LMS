"""sync_models_with_db

Sincroniza el schema de la DB con los modelos SQLAlchemy actuales.
Resuelve discrepancias acumuladas tras la migracion Express/Prisma -> FastAPI.

Tablas con 0 registros (DROP+RECREATE seguro): chat_messages, translations,
audit_logs, project_submissions.
Tablas con datos (ALTER aditivo): users, enrollments, notifications, labs, projects.

Revision ID: a1b2c3d4e5f6
Revises: 873af25b4e72
Create Date: 2026-05-20 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '873af25b4e72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Bloque 1: users (ALTER - preserva 22+ registros) ──
    op.add_column('users', sa.Column('auth_provider', sa.String(50), nullable=False, server_default='local'))
    op.add_column('users', sa.Column('external_id', sa.String(255), nullable=True))
    op.alter_column('users', 'password_hash', existing_type=sa.String(255), nullable=True)
    op.create_index('ix_users_auth_provider_external_id', 'users', ['auth_provider', 'external_id'])

    # ── Bloque 2: chat_messages (DROP+RECREATE - 0 registros) ──
    op.drop_table('chat_messages')
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('user_id', sa.String(32), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('room', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── Bloque 3: translations (DROP+RECREATE - 0 registros) ──
    op.drop_table('translations')
    op.create_table(
        'translations',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.String(32), nullable=False),
        sa.Column('field', sa.String(100), nullable=False),
        sa.Column('locale', sa.String(10), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_translations_lookup', 'translations', ['entity_type', 'entity_id', 'field', 'locale'])

    # ── Bloque 4: audit_logs (DROP+RECREATE - 0 registros) ──
    op.drop_table('audit_logs')
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('user_id', sa.String(32), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.String(32), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── Bloque 5: project_submissions (DROP+RECREATE - 0 registros) ──
    op.drop_table('project_submissions')
    op.create_table(
        'project_submissions',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('user_id', sa.String(32), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', sa.String(32), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('files', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_project_submissions_user_id', 'project_submissions', ['user_id'])

    # ── Bloque 6: enrollments constraint rename (preserva 15+ registros) ──
    op.drop_constraint('uq_enrollment_user_course', 'enrollments', type_='unique')
    op.create_unique_constraint('uq_enrollments_user_course', 'enrollments', ['user_id', 'course_id'])

    # ── Bloque 7: notifications index ──
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])

    # ── Bloque 8: labs.tests nullable ──
    op.alter_column('labs', 'tests', existing_type=sa.JSON(), nullable=True)

    # ── Bloque 9: projects - quitar due_date (modelo no lo tiene) ──
    op.drop_column('projects', 'due_date')


def downgrade() -> None:
    # ── Bloque 9 revert ──
    op.add_column('projects', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))

    # ── Bloque 8 revert ──
    op.alter_column('labs', 'tests', existing_type=sa.JSON(), nullable=False)

    # ── Bloque 7 revert ──
    op.drop_index('ix_notifications_created_at', table_name='notifications')

    # ── Bloque 6 revert ──
    op.drop_constraint('uq_enrollments_user_course', 'enrollments', type_='unique')
    op.create_unique_constraint('uq_enrollment_user_course', 'enrollments', ['user_id', 'course_id'])

    # ── Bloque 5 revert ──
    op.drop_table('project_submissions')
    op.create_table(
        'project_submissions',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('user_id', sa.String(32), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', sa.String(32), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('repository_url', sa.String(500), nullable=True),
        sa.Column('files', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.String(32), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── Bloque 4 revert ──
    op.drop_table('audit_logs')
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('user_id', sa.String(32), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(100), nullable=False),
        sa.Column('entity_id', sa.String(32), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── Bloque 3 revert ──
    op.drop_table('translations')
    op.create_table(
        'translations',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('locale', sa.String(10), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('context', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── Bloque 2 revert ──
    op.drop_table('chat_messages')
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('sender_id', sa.String(32), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', sa.String(32), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('room_id', sa.String(100), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(20), nullable=False, server_default='text'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── Bloque 1 revert ──
    op.drop_index('ix_users_auth_provider_external_id', table_name='users')
    op.alter_column('users', 'password_hash', existing_type=sa.String(255), nullable=False)
    op.drop_column('users', 'external_id')
    op.drop_column('users', 'auth_provider')
