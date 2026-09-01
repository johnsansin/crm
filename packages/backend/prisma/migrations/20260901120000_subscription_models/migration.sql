CREATE TABLE "SubscriptionModel" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(30) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(12,2),
  "billingCycle" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  "userLimit" INTEGER NOT NULL DEFAULT 3,
  "contactLimit" INTEGER NOT NULL DEFAULT 2000,
  "features" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionModel_code_key" ON "SubscriptionModel"("code");
ALTER TABLE "Company" ADD COLUMN "subscriptionModelId" TEXT;
CREATE INDEX "Company_subscriptionModelId_idx" ON "Company"("subscriptionModelId");
ALTER TABLE "Company" ADD CONSTRAINT "Company_subscriptionModelId_fkey" FOREIGN KEY ("subscriptionModelId") REFERENCES "SubscriptionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SubscriptionModel" ("id", "code", "name", "description", "price", "billingCycle", "userLimit", "contactLimit", "features", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'STARTER', 'Starter', 'Core CRM for small teams', NULL, 'MONTHLY', 3, 2000, '[]'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'GROWTH', 'Growth', 'More capacity for growing organisations', NULL, 'MONTHLY', 50, 50000, '[]'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'ENTERPRISE', 'Enterprise', 'Enterprise-scale CRM access', NULL, 'MONTHLY', 250, 250000, '[]'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CUSTOM', 'Custom', 'Custom limits and commercial terms', NULL, 'CUSTOM', 3, 2000, '[]'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Company" c SET "subscriptionModelId" = m."id" FROM "SubscriptionModel" m WHERE m."code" = c."subscriptionPlan";
