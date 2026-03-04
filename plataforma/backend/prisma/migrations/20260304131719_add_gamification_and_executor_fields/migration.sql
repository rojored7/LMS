-- ==================================
-- MIGRACIÓN: Add Gamification and Executor Fields
-- ==================================

-- 1. Add XP field to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;

-- 2. Modify lab_submissions table
-- Add new columns
ALTER TABLE "lab_submissions"
  ADD COLUMN IF NOT EXISTS "language" TEXT,
  ADD COLUMN IF NOT EXISTS "stdout" TEXT,
  ADD COLUMN IF NOT EXISTS "stderr" TEXT,
  ADD COLUMN IF NOT EXISTS "exitCode" INTEGER,
  ADD COLUMN IF NOT EXISTS "executionTime" INTEGER,
  ADD COLUMN IF NOT EXISTS "feedback" TEXT;

-- Copy output to stdout if stdout is empty
UPDATE "lab_submissions" SET "stdout" = "output" WHERE "stdout" IS NULL AND "output" IS NOT NULL;

-- Set language from parent lab
UPDATE "lab_submissions" ls
SET "language" = l."language"
FROM "labs" l
WHERE ls."labId" = l."id" AND ls."language" IS NULL;

-- Make language NOT NULL
ALTER TABLE "lab_submissions" ALTER COLUMN "language" SET NOT NULL;

-- Drop old output column
ALTER TABLE "lab_submissions" DROP COLUMN IF EXISTS "output";

-- 3. Modify project_submissions table
-- Add new columns
ALTER TABLE "project_submissions"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "score" INTEGER,
  ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Copy grade to score
UPDATE "project_submissions" SET "score" = "grade" WHERE "score" IS NULL;

-- Copy gradedAt to reviewedAt
UPDATE "project_submissions" SET "reviewedAt" = "gradedAt" WHERE "reviewedAt" IS NULL;

-- Drop old columns
ALTER TABLE "project_submissions" DROP COLUMN IF EXISTS "grade";
ALTER TABLE "project_submissions" DROP COLUMN IF EXISTS "gradedAt";

-- 4. Create Badge table
CREATE TABLE IF NOT EXISTS "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- 5. Create UserBadge table
CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- 6. Create NotificationType enum
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM (
        'BADGE_AWARDED',
        'COURSE_COMPLETED',
        'CERTIFICATE_ISSUED',
        'QUIZ_PASSED',
        'LAB_PASSED',
        'PROJECT_GRADED',
        'COURSE_ASSIGNED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Create Notification table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 8. Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "badges_name_key" ON "badges"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "badges_slug_key" ON "badges"("slug");
CREATE INDEX IF NOT EXISTS "badges_slug_idx" ON "badges"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");
CREATE INDEX IF NOT EXISTS "user_badges_userId_idx" ON "user_badges"("userId");
CREATE INDEX IF NOT EXISTS "user_badges_badgeId_idx" ON "user_badges"("badgeId");

CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- 9. Add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_userId_fkey'
    ) THEN
        ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_badgeId_fkey'
    ) THEN
        ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey"
            FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey'
    ) THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_submissions_reviewedBy_fkey'
    ) THEN
        ALTER TABLE "project_submissions" ADD CONSTRAINT "project_submissions_reviewedBy_fkey"
            FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 10. Add emailSent field to certificates
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN NOT NULL DEFAULT false;
