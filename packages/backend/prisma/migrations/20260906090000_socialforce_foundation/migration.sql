-- CreateTable
CREATE TABLE "SocialForcePost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "plannedAt" TIMESTAMP(3),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewNote" VARCHAR(2000),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialForcePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialForceBrand" (
    "companyId" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL DEFAULT '',
    "description" VARCHAR(4000) NOT NULL DEFAULT '',
    "audience" VARCHAR(2000) NOT NULL DEFAULT '',
    "tone" VARCHAR(500) NOT NULL DEFAULT 'Professional, helpful, confident',
    "language" VARCHAR(100) NOT NULL DEFAULT 'English',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
    "website" VARCHAR(500) NOT NULL DEFAULT '',
    "hashtags" VARCHAR(1000) NOT NULL DEFAULT '',
    "forbiddenWords" VARCHAR(2000) NOT NULL DEFAULT '',
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialForceBrand_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "SocialForceEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resourceId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialForceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialForcePost_companyId_status_createdAt_idx" ON "SocialForcePost"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SocialForcePost_companyId_plannedAt_idx" ON "SocialForcePost"("companyId", "plannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialForcePost_companyId_id_key" ON "SocialForcePost"("companyId", "id");

-- CreateIndex
CREATE INDEX "SocialForceEvent_companyId_createdAt_idx" ON "SocialForceEvent"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialForcePost" ADD CONSTRAINT "SocialForcePost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialForceBrand" ADD CONSTRAINT "SocialForceBrand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialForceEvent" ADD CONSTRAINT "SocialForceEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

