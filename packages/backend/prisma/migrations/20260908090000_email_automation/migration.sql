ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailStatus" VARCHAR(50) NOT NULL DEFAULT 'NOT_CONTACTED';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastEmailAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastEmailStatus" VARCHAR(50);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastOpenedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastClickedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastReplyAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailSequenceName" VARCHAR(200);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailSequenceStatus" VARCHAR(50);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailFollowUpCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "EmailSequence" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "fromEmail" VARCHAR(200),
  "replyTo" VARCHAR(200),
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
  "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  "sendWindow" JSONB DEFAULT '{}',
  "rateLimits" JSONB DEFAULT '{}',
  "stopOnReply" BOOLEAN NOT NULL DEFAULT true,
  "stopOnBounce" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailSequenceStep" (
  "id" TEXT NOT NULL,
  "sequenceId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "subject" VARCHAR(500) NOT NULL,
  "body" TEXT NOT NULL,
  "delayValue" INTEGER NOT NULL DEFAULT 0,
  "delayUnit" VARCHAR(20) NOT NULL DEFAULT 'DAYS',
  "condition" VARCHAR(50) NOT NULL DEFAULT 'NO_REPLY',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSequenceStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeadSequenceEnrollment" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "sequenceId" TEXT NOT NULL,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastEmailAt" TIMESTAMP(3),
  "lastReplyAt" TIMESTAMP(3),
  "nextActionAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "stopReason" VARCHAR(100),
  "failureReason" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadSequenceEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailConversation" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "emailAccountId" TEXT,
  "subject" VARCHAR(500),
  "threadId" VARCHAR(500),
  "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3),
  "lastIncomingMessageAt" TIMESTAMP(3),
  "lastOutgoingMessageAt" TIMESTAMP(3),
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailMessage" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "sequenceId" TEXT,
  "sequenceStepId" TEXT,
  "enrollmentId" TEXT,
  "conversationId" TEXT,
  "threadId" VARCHAR(500),
  "provider" VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
  "providerMessageId" VARCHAR(500),
  "messageId" VARCHAR(500),
  "idempotencyKey" VARCHAR(500),
  "fromEmail" VARCHAR(200) NOT NULL,
  "toEmail" VARCHAR(200) NOT NULL,
  "cc" TEXT,
  "bcc" TEXT,
  "subject" VARCHAR(500) NOT NULL,
  "body" TEXT,
  "htmlBody" TEXT,
  "textBody" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "companyId" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailEvent" (
  "id" TEXT NOT NULL,
  "leadId" TEXT,
  "emailMessageId" TEXT,
  "conversationId" TEXT,
  "eventType" VARCHAR(50) NOT NULL,
  "provider" VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
  "providerEventId" VARCHAR(500),
  "eventTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB DEFAULT '{}',
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailReply" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "emailMessageId" TEXT,
  "conversationId" TEXT,
  "providerMessageId" VARCHAR(500),
  "messageId" VARCHAR(500),
  "inReplyTo" VARCHAR(500),
  "references" TEXT,
  "fromEmail" VARCHAR(200) NOT NULL,
  "toEmail" VARCHAR(200) NOT NULL,
  "subject" VARCHAR(500),
  "body" TEXT,
  "htmlBody" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeadEmailActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "activityType" VARCHAR(80) NOT NULL,
  "referenceId" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "companyId" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadEmailActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailSuppression" (
  "id" TEXT NOT NULL,
  "email" VARCHAR(200) NOT NULL,
  "reason" VARCHAR(100) NOT NULL,
  "source" VARCHAR(100),
  "metadata" JSONB DEFAULT '{}',
  "companyId" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "EmailSequenceStep" ADD CONSTRAINT "EmailSequenceStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "EmailSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "LeadSequenceEnrollment" ADD CONSTRAINT "LeadSequenceEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "EmailSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "EmailSequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_sequenceStepId_fkey" FOREIGN KEY ("sequenceStepId") REFERENCES "EmailSequenceStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "LeadSequenceEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "EmailConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "EmailConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailReply" ADD CONSTRAINT "EmailReply_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailReply" ADD CONSTRAINT "EmailReply_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "EmailConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Lead_emailStatus_idx" ON "Lead"("emailStatus");
CREATE INDEX IF NOT EXISTS "Lead_companyId_emailStatus_idx" ON "Lead"("companyId", "emailStatus");
CREATE INDEX IF NOT EXISTS "Lead_companyId_nextFollowUp_idx" ON "Lead"("companyId", "nextFollowUp");
CREATE INDEX IF NOT EXISTS "EmailSequence_companyId_idx" ON "EmailSequence"("companyId");
CREATE INDEX IF NOT EXISTS "EmailSequence_companyId_status_idx" ON "EmailSequence"("companyId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailSequenceStep_companyId_sequenceId_stepNumber_key" ON "EmailSequenceStep"("companyId", "sequenceId", "stepNumber");
CREATE INDEX IF NOT EXISTS "EmailSequenceStep_companyId_sequenceId_idx" ON "EmailSequenceStep"("companyId", "sequenceId");
CREATE UNIQUE INDEX IF NOT EXISTS "LeadSequenceEnrollment_active_unique" ON "LeadSequenceEnrollment"("companyId", "leadId", "sequenceId") WHERE "status" IN ('ACTIVE', 'PAUSED');
CREATE INDEX IF NOT EXISTS "LeadSequenceEnrollment_companyId_status_nextActionAt_idx" ON "LeadSequenceEnrollment"("companyId", "status", "nextActionAt");
CREATE INDEX IF NOT EXISTS "LeadSequenceEnrollment_companyId_leadId_idx" ON "LeadSequenceEnrollment"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "LeadSequenceEnrollment_companyId_sequenceId_idx" ON "LeadSequenceEnrollment"("companyId", "sequenceId");
CREATE INDEX IF NOT EXISTS "EmailConversation_companyId_leadId_idx" ON "EmailConversation"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "EmailConversation_companyId_threadId_idx" ON "EmailConversation"("companyId", "threadId");
CREATE INDEX IF NOT EXISTS "EmailConversation_companyId_status_idx" ON "EmailConversation"("companyId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailMessage_companyId_idempotencyKey_key" ON "EmailMessage"("companyId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_leadId_idx" ON "EmailMessage"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_conversationId_idx" ON "EmailMessage"("companyId", "conversationId");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_providerMessageId_idx" ON "EmailMessage"("companyId", "providerMessageId");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_messageId_idx" ON "EmailMessage"("companyId", "messageId");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_status_idx" ON "EmailMessage"("companyId", "status");
CREATE INDEX IF NOT EXISTS "EmailMessage_companyId_createdAt_idx" ON "EmailMessage"("companyId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailEvent_companyId_provider_providerEventId_key" ON "EmailEvent"("companyId", "provider", "providerEventId");
CREATE INDEX IF NOT EXISTS "EmailEvent_companyId_leadId_idx" ON "EmailEvent"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "EmailEvent_companyId_emailMessageId_idx" ON "EmailEvent"("companyId", "emailMessageId");
CREATE INDEX IF NOT EXISTS "EmailEvent_companyId_conversationId_idx" ON "EmailEvent"("companyId", "conversationId");
CREATE INDEX IF NOT EXISTS "EmailEvent_companyId_eventType_idx" ON "EmailEvent"("companyId", "eventType");
CREATE INDEX IF NOT EXISTS "EmailEvent_companyId_eventTimestamp_idx" ON "EmailEvent"("companyId", "eventTimestamp");
CREATE INDEX IF NOT EXISTS "EmailReply_companyId_leadId_idx" ON "EmailReply"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "EmailReply_companyId_emailMessageId_idx" ON "EmailReply"("companyId", "emailMessageId");
CREATE INDEX IF NOT EXISTS "EmailReply_companyId_conversationId_idx" ON "EmailReply"("companyId", "conversationId");
CREATE INDEX IF NOT EXISTS "EmailReply_companyId_providerMessageId_idx" ON "EmailReply"("companyId", "providerMessageId");
CREATE INDEX IF NOT EXISTS "EmailReply_companyId_messageId_idx" ON "EmailReply"("companyId", "messageId");
CREATE INDEX IF NOT EXISTS "LeadEmailActivity_companyId_leadId_idx" ON "LeadEmailActivity"("companyId", "leadId");
CREATE INDEX IF NOT EXISTS "LeadEmailActivity_companyId_activityType_idx" ON "LeadEmailActivity"("companyId", "activityType");
CREATE INDEX IF NOT EXISTS "LeadEmailActivity_companyId_createdAt_idx" ON "LeadEmailActivity"("companyId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailSuppression_companyId_email_key" ON "EmailSuppression"("companyId", "email");
CREATE INDEX IF NOT EXISTS "EmailSuppression_companyId_reason_idx" ON "EmailSuppression"("companyId", "reason");
