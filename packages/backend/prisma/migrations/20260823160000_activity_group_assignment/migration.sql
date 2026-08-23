ALTER TABLE "Activity" ADD COLUMN "assignedGroupId" TEXT;
CREATE INDEX "Activity_assignedGroupId_idx" ON "Activity"("assignedGroupId");
