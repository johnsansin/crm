-- Align existing SocialForce drafts with the accountIds field in the Prisma schema.
ALTER TABLE "SocialForcePost"
ADD COLUMN IF NOT EXISTS "accountIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
