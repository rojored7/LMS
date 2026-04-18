"""userbadge_unique_constraint

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-17

"""
from typing import Sequence, Union

from alembic import op

revision: str = '0006'
down_revision: Union[str, None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uq_user_badge', 'user_badges', ['user_id', 'badge_id'])
    op.create_index('ix_badges_course_id', 'badges', ['course_id'])


def downgrade() -> None:
    op.drop_index('ix_badges_course_id', table_name='badges')
    op.drop_constraint('uq_user_badge', 'user_badges', type_='unique')
