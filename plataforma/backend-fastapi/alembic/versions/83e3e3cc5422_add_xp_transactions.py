"""add_xp_transactions

Revision ID: 83e3e3cc5422
Revises: 0007
Create Date: 2026-05-04 17:01:16.358723

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '83e3e3cc5422'
down_revision: Union[str, None] = '0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('xp_transactions',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('user_id', sa.String(length=32), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('admin_id', sa.String(length=32), nullable=True),
        sa.Column('reference_id', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_xp_transactions_user_created', 'xp_transactions', ['user_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_xp_transactions_user_created', table_name='xp_transactions')
    op.drop_table('xp_transactions')
