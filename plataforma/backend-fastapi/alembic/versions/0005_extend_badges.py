"""extend_badges

Revision ID: 0005
Revises: 0003
Create Date: 2026-04-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0005'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Badge table extensions
    op.add_column('badges', sa.Column('course_id', sa.String(32), sa.ForeignKey('courses.id', ondelete='SET NULL'), nullable=True))
    op.add_column('badges', sa.Column('level', sa.String(50), nullable=True))
    op.add_column('badges', sa.Column('duration_hours', sa.Integer(), nullable=True))
    op.add_column('badges', sa.Column('source', sa.String(255), nullable=False, server_default='platform'))
    op.add_column('badges', sa.Column('is_external', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('badges', sa.Column('category', sa.String(100), nullable=True))
    op.add_column('badges', sa.Column('icon_url', sa.String(500), nullable=True))
    op.add_column('badges', sa.Column('requirement', sa.String(500), nullable=True))

    # UserBadge table extensions
    op.add_column('user_badges', sa.Column('enrolled_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_badges', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_badges', sa.Column('course_id', sa.String(32), sa.ForeignKey('courses.id', ondelete='SET NULL'), nullable=True))

    # Update existing seed badges with category
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE badges SET category = 'achievement' WHERE category IS NULL"))

    # Remove server defaults after backfill
    op.alter_column('badges', 'source', server_default=None)
    op.alter_column('badges', 'is_external', server_default=None)


def downgrade() -> None:
    op.drop_column('user_badges', 'course_id')
    op.drop_column('user_badges', 'completed_at')
    op.drop_column('user_badges', 'enrolled_at')
    op.drop_column('badges', 'requirement')
    op.drop_column('badges', 'icon_url')
    op.drop_column('badges', 'category')
    op.drop_column('badges', 'is_external')
    op.drop_column('badges', 'source')
    op.drop_column('badges', 'duration_hours')
    op.drop_column('badges', 'level')
    op.drop_column('badges', 'course_id')
