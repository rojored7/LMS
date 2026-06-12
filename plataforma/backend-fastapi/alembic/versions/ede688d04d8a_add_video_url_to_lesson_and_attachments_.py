"""add_video_url_to_lesson_and_attachments_table

Revision ID: ede688d04d8a
Revises: a1b2c3d4e5f6
Create Date: 2026-06-12 16:35:36.766953

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ede688d04d8a'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # attachments table
    op.execute("""
        CREATE TABLE IF NOT EXISTS attachments (
            id VARCHAR(32) NOT NULL PRIMARY KEY,
            lesson_id VARCHAR(32) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            original_filename VARCHAR(500) NOT NULL,
            stored_filename VARCHAR(200) NOT NULL,
            file_path VARCHAR(1000) NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            description VARCHAR(500),
            uploaded_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_attachments_lesson_id ON attachments (lesson_id)")

    # Drop obsolete indexes/constraints (IF EXISTS = safe to re-run)
    op.execute("DROP INDEX IF EXISTS ix_badges_course_id")
    op.execute("DROP INDEX IF EXISTS ix_badges_slug")
    op.execute("DROP INDEX IF EXISTS ix_certificates_course_id")
    op.execute("DROP INDEX IF EXISTS ix_certificates_user_id")
    op.execute("DROP INDEX IF EXISTS ix_certificates_verification_code")
    op.execute("ALTER TABLE certificates DROP CONSTRAINT IF EXISTS uq_certificate_user_course")
    op.execute("DROP INDEX IF EXISTS ix_lab_submissions_user_lab")
    op.execute("DROP INDEX IF EXISTS ix_password_reset_tokens_user_id")
    op.execute("DROP INDEX IF EXISTS ix_projects_course_id")
    op.execute("DROP INDEX IF EXISTS ix_questions_quiz_id")
    op.execute("DROP INDEX IF EXISTS ix_scorm_packages_course_id")
    op.execute("DROP INDEX IF EXISTS ix_training_profiles_slug")
    op.execute("ALTER TABLE training_profiles DROP CONSTRAINT IF EXISTS training_profiles_name_key")
    op.execute("DROP INDEX IF EXISTS ix_user_badges_badge_id")
    op.execute("DROP INDEX IF EXISTS ix_user_badges_user_id")
    op.execute("DROP INDEX IF EXISTS ix_users_training_profile_id")

    # Resize language columns
    op.execute("ALTER TABLE lab_submissions ALTER COLUMN language TYPE VARCHAR(30)")
    op.execute("ALTER TABLE labs ALTER COLUMN language TYPE VARCHAR(30)")

    # video_url + video_provider on lessons
    op.execute("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url VARCHAR(2048)")
    op.execute("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_provider VARCHAR(50)")

    # notifications enum: convert to non-native so new values work without DDL
    op.execute("""
        ALTER TABLE notifications
        ALTER COLUMN type TYPE VARCHAR(50) USING type::text
    """)

    # project_submissions status to plain VARCHAR
    op.execute("ALTER TABLE project_submissions ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE project_submissions ALTER COLUMN status TYPE VARCHAR(20) USING status::varchar")
    op.execute("UPDATE project_submissions SET status = 'PENDING' WHERE status NOT IN ('PENDING','REVIEWING','APPROVED','REJECTED')")
    op.execute("ALTER TABLE project_submissions ALTER COLUMN status SET DEFAULT 'PENDING'")

    # questions.correct_answer nullable
    op.execute("ALTER TABLE questions ALTER COLUMN correct_answer DROP NOT NULL")

    # user_progress status to VARCHAR (non-native enum)
    op.execute("ALTER TABLE user_progress ALTER COLUMN status TYPE VARCHAR(20) USING status::text")

    # user_progress composite index
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_progress_user_module_lesson ON user_progress (user_id, module_id, lesson_id)")

    # user_progress FK cascade (drop old, create new)
    op.execute("ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_enrollment_id_fkey")
    op.execute("ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey")
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_type='FOREIGN KEY'
                AND table_name='user_progress'
                AND constraint_name LIKE '%lesson%cascade%'
            ) THEN
                ALTER TABLE user_progress ADD CONSTRAINT user_progress_lesson_id_cascade_fkey
                    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
            END IF;
        END $$
    """)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_type='FOREIGN KEY'
                AND table_name='user_progress'
                AND constraint_name LIKE '%enrollment%cascade%'
            ) THEN
                ALTER TABLE user_progress ADD CONSTRAINT user_progress_enrollment_id_cascade_fkey
                    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE;
            END IF;
        END $$
    """)


def downgrade() -> None:
    op.execute("DROP COLUMN IF EXISTS video_provider FROM lessons")
    op.execute("DROP COLUMN IF EXISTS video_url FROM lessons")
    op.execute("DROP INDEX IF EXISTS ix_attachments_lesson_id")
    op.execute("DROP TABLE IF EXISTS attachments")
