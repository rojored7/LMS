"""add_course_score

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'courses',
        sa.Column('score', sa.Integer(), nullable=False, server_default='1'),
    )

    # Backfill existing courses using the scoring formula:
    # Level points: BEGINNER=0, INTERMEDIATE=2, ADVANCED=4, EXPERT=6
    # Duration points: piece-wise linear (duration is in minutes)
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE courses SET score = LEAST(10, GREATEST(1, ROUND(
            CASE level
                WHEN 'BEGINNER' THEN 0
                WHEN 'INTERMEDIATE' THEN 2
                WHEN 'ADVANCED' THEN 4
                WHEN 'EXPERT' THEN 6
                ELSE 0
            END
            +
            CASE
                WHEN duration <= 600 THEN (duration / 600.0) * 1.0
                WHEN duration <= 1800 THEN 1.0 + ((duration - 600) / 1200.0) * 1.0
                WHEN duration <= 3600 THEN 2.0 + ((duration - 1800) / 1800.0) * 1.0
                ELSE 3.0 + LEAST(1.0, (duration - 3600) / 3600.0)
            END
        )))
    """))

    op.alter_column('courses', 'score', server_default=None)


def downgrade() -> None:
    op.drop_column('courses', 'score')
