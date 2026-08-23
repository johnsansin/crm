CREATE TYPE "SupportConversationStatus" AS ENUM ('AI_ACTIVE','WAITING_FOR_AGENT','AGENT_ASSIGNED','AGENT_ACTIVE','RESOLVED','CLOSED');
CREATE TYPE "SupportPriority" AS ENUM ('LOW','NORMAL','HIGH','URGENT');
CREATE TYPE "SupportSenderType" AS ENUM ('CUSTOMER','AI','AGENT','SYSTEM');
CREATE TYPE "SupportMessageType" AS ENUM ('TEXT','SYSTEM','FILE','IMAGE');

CREATE TABLE "SupportConversation" (
  "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "createdByUserId" TEXT NOT NULL,
  "assignedAgentId" TEXT, "departmentId" TEXT,
  "status" "SupportConversationStatus" NOT NULL DEFAULT 'AI_ACTIVE',
  "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL', "subject" VARCHAR(240),
  "channel" VARCHAR(30) NOT NULL DEFAULT 'SUPPORT', "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
  "humanRequested" BOOLEAN NOT NULL DEFAULT false, "customerLastReadAt" TIMESTAMP(3),
  "agentLastReadAt" TIMESTAMP(3), "firstAgentResponseAt" TIMESTAMP(3),
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderType" "SupportSenderType" NOT NULL,
  "senderId" TEXT, "messageType" "SupportMessageType" NOT NULL DEFAULT 'TEXT', "content" TEXT NOT NULL,
  "metadata" JSONB, "clientMessageId" VARCHAR(100), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportAuditEvent" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "companyId" TEXT NOT NULL, "actorUserId" TEXT,
  "action" VARCHAR(80) NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportConversation_companyId_idx" ON "SupportConversation"("companyId");
CREATE INDEX "SupportConversation_status_idx" ON "SupportConversation"("status");
CREATE INDEX "SupportConversation_assignedAgentId_idx" ON "SupportConversation"("assignedAgentId");
CREATE INDEX "SupportConversation_lastMessageAt_idx" ON "SupportConversation"("lastMessageAt");
CREATE INDEX "SupportConversation_createdAt_idx" ON "SupportConversation"("createdAt");
CREATE INDEX "SupportConversation_status_priority_createdAt_idx" ON "SupportConversation"("status","priority","createdAt");
CREATE UNIQUE INDEX "SupportMessage_conversationId_clientMessageId_key" ON "SupportMessage"("conversationId","clientMessageId");
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId","createdAt");
CREATE INDEX "SupportAuditEvent_conversationId_createdAt_idx" ON "SupportAuditEvent"("conversationId","createdAt");
CREATE INDEX "SupportAuditEvent_companyId_createdAt_idx" ON "SupportAuditEvent"("companyId","createdAt");
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
