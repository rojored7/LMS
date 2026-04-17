"""stamp baseline for autogenerate

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-17

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: establece baseline para futuros autogenerate.

    Todas las tablas ya existen via 0001_initial_schema.
    Futuros cambios deben usar op.add_column(), op.create_table(), etc.
    """
    pass


def downgrade() -> None:
    pass
