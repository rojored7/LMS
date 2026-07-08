"""add ldap_configuration table

Revision ID: 92d0f4cc0cc7
Revises: f1a2b3c4d5e6
Create Date: 2026-07-07 23:03:55.049294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '92d0f4cc0cc7'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('ldap_configuration',
    sa.Column('id', sa.String(length=50), nullable=False),
    sa.Column('server_url', sa.String(length=500), nullable=False),
    sa.Column('use_ssl', sa.Boolean(), nullable=False),
    sa.Column('timeout', sa.Integer(), nullable=False),
    sa.Column('bind_dn', sa.String(length=500), nullable=False),
    sa.Column('bind_password_encrypted', sa.Text(), nullable=False),
    sa.Column('base_dn', sa.String(length=500), nullable=False),
    sa.Column('search_filter', sa.String(length=500), nullable=False),
    sa.Column('email_attr', sa.String(length=100), nullable=False),
    sa.Column('name_attr', sa.String(length=100), nullable=False),
    sa.Column('group_attr', sa.String(length=100), nullable=False),
    sa.Column('role_mapping', sa.Text(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('ldap_configuration')
