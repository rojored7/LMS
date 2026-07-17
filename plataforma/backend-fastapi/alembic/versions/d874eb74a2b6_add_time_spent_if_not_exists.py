"""add_time_spent_if_not_exists

Revision ID: d874eb74a2b6
Revises: 92d0f4cc0cc7
Create Date: 2026-07-17 05:22:14.736776

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd874eb74a2b6'
down_revision: Union[str, None] = '92d0f4cc0cc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE user_progress
        ADD COLUMN IF NOT EXISTS time_spent INTEGER NOT NULL DEFAULT 0
        """
    )


def downgrade() -> None:
    pass  # No destruir datos en downgrade
