"""add_xp_indexes

Revision ID: 873af25b4e72
Revises: 83e3e3cc5422
Create Date: 2026-05-05 22:13:30.412374

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '873af25b4e72'
down_revision: Union[str, None] = '83e3e3cc5422'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_users_xp', 'users', ['xp'], unique=False)
    op.create_index('ix_xp_transactions_created_at', 'xp_transactions', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_xp_transactions_created_at', table_name='xp_transactions')
    op.drop_index('ix_users_xp', table_name='users')
