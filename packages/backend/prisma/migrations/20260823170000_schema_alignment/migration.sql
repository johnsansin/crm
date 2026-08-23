-- Align the database with schema changes that previously had no migration.
-- IF EXISTS / IF NOT EXISTS keeps this migration safe for databases where
-- the two User columns were hot-fixed before this migration was deployed.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "sidebarColor" VARCHAR(30) DEFAULT 'vtiger',
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ChatSession"
  ADD COLUMN IF NOT EXISTS "visitorToken" TEXT;

ALTER TABLE "ProjectTask"
  ADD COLUMN IF NOT EXISTS "milestoneId" TEXT;

ALTER TABLE "Tag"
  ADD COLUMN IF NOT EXISTS "color" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parentTagId" TEXT;

DROP INDEX IF EXISTS "Project_projectNo_key";
DROP INDEX IF EXISTS "ProjectMilestone_milestoneNo_key";
DROP INDEX IF EXISTS "ProjectTask_projectTaskNo_key";
DROP INDEX IF EXISTS "Translation_locale_key_namespace_key";

CREATE INDEX IF NOT EXISTS "ChatSession_visitorToken_idx"
  ON "ChatSession"("visitorToken");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx"
  ON "Project"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "Project_companyId_projectNo_key"
  ON "Project"("companyId", "projectNo");
CREATE INDEX IF NOT EXISTS "ProjectMilestone_projectId_idx"
  ON "ProjectMilestone"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectMilestone_companyId_idx"
  ON "ProjectMilestone"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectMilestone_companyId_milestoneNo_key"
  ON "ProjectMilestone"("companyId", "milestoneNo");
CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx"
  ON "ProjectTask"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectTask_milestoneId_idx"
  ON "ProjectTask"("milestoneId");
CREATE INDEX IF NOT EXISTS "ProjectTask_companyId_idx"
  ON "ProjectTask"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectTask_companyId_projectTaskNo_key"
  ON "ProjectTask"("companyId", "projectTaskNo");
CREATE INDEX IF NOT EXISTS "Tag_parentTagId_idx"
  ON "Tag"("parentTagId");
CREATE UNIQUE INDEX IF NOT EXISTS "Translation_companyId_locale_key_namespace_key"
  ON "Translation"("companyId", "locale", "key", "namespace");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProjectTask_milestoneId_fkey'
  ) THEN
    ALTER TABLE "ProjectTask"
      ADD CONSTRAINT "ProjectTask_milestoneId_fkey"
      FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
