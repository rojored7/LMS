"""add_lab_type_and_deliverable_fields

Revision ID: f1a2b3c4d5e6
Revises: ede688d04d8a
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'ede688d04d8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # labs table — new columns
    op.execute("ALTER TABLE labs ADD COLUMN IF NOT EXISTS lab_type VARCHAR(20) NOT NULL DEFAULT 'EXECUTABLE'")
    op.execute("ALTER TABLE labs ADD COLUMN IF NOT EXISTS response_instructions TEXT")
    op.execute("ALTER TABLE labs ADD COLUMN IF NOT EXISTS file_required BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE labs ADD COLUMN IF NOT EXISTS allowed_file_types VARCHAR(200)")

    # lab_submissions — passed becomes nullable (DELIVERABLE starts as NULL = pending review)
    op.execute("ALTER TABLE lab_submissions ALTER COLUMN passed DROP NOT NULL")
    op.execute("ALTER TABLE lab_submissions ALTER COLUMN passed DROP DEFAULT")

    # lab_submissions — new columns for DELIVERABLE
    op.execute("ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS response_text TEXT")
    op.execute("ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS file_path VARCHAR(500)")
    op.execute("ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS score INTEGER")
    op.execute("ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS graded_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE lab_submissions DROP COLUMN IF EXISTS graded_at")
    op.execute("ALTER TABLE lab_submissions DROP COLUMN IF EXISTS graded_by")
    op.execute("ALTER TABLE lab_submissions DROP COLUMN IF EXISTS score")
    op.execute("ALTER TABLE lab_submissions DROP COLUMN IF EXISTS file_path")
    op.execute("ALTER TABLE lab_submissions DROP COLUMN IF EXISTS response_text")
    op.execute("ALTER TABLE lab_submissions ALTER COLUMN passed SET NOT NULL")
    op.execute("ALTER TABLE lab_submissions ALTER COLUMN passed SET DEFAULT FALSE")
    op.execute("ALTER TABLE labs DROP COLUMN IF EXISTS allowed_file_types")
    op.execute("ALTER TABLE labs DROP COLUMN IF EXISTS file_required")
    op.execute("ALTER TABLE labs DROP COLUMN IF EXISTS response_instructions")
    op.execute("ALTER TABLE labs DROP COLUMN IF EXISTS lab_type")
