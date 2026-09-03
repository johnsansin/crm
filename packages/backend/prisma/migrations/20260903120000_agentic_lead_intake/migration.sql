CREATE TABLE "LeadCandidate" (
  "id" TEXT NOT NULL,
  "source" VARCHAR(100) NOT NULL,
  "sourceReference" VARCHAR(300),
  "consentBasis" VARCHAR(200),
  "fingerprint" VARCHAR(64) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "company" VARCHAR(200) NOT NULL,
  "email" VARCHAR(100),
  "phone" VARCHAR(30),
  "website" VARCHAR(200),
  "title" VARCHAR(100),
  "industry" VARCHAR(100),
  "country" VARCHAR(100),
  "employeeCount" INTEGER,
  "score" INTEGER NOT NULL,
  "band" VARCHAR(20) NOT NULL,
  "reasons" TEXT NOT NULL,
  "rawPayload" TEXT,
  "duplicateLeadId" TEXT,
  "createdLeadId" TEXT,
  "companyId" TEXT NOT NULL,
  "createdBy" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeadCandidate_companyId_fingerprint_key" ON "LeadCandidate"("companyId", "fingerprint");
CREATE INDEX "LeadCandidate_companyId_status_createdAt_idx" ON "LeadCandidate"("companyId", "status", "createdAt");
CREATE INDEX "LeadCandidate_createdLeadId_idx" ON "LeadCandidate"("createdLeadId");
