ALTER TABLE "Activity" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
CREATE INDEX "Activity_reminderAt_reminderSentAt_idx" ON "Activity"("reminderAt", "reminderSentAt");
