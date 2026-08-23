UPDATE "Currency" SET "isActive" = false, "isDefault" = false;

INSERT INTO "Currency" ("id", "name", "code", "symbol", "rate", "isDefault", "isActive", "companyId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'US Dollar', 'USD', '$', 1, true, true, company."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Company" company
WHERE NOT EXISTS (
  SELECT 1 FROM "Currency" currency WHERE currency."companyId" = company."id" AND currency."code" = 'USD'
);

UPDATE "Currency" SET "isActive" = true, "isDefault" = true WHERE "code" = 'USD' AND "companyId" IS NOT NULL;
UPDATE "Company" SET "defaultCurrency" = 'USD';

INSERT INTO "OrgSetting" ("id", "companyId", "key", "value", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, company."id", 'defaultCurrency', '"USD"'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Company" company
ON CONFLICT ("companyId", "key") DO UPDATE SET "value" = '"USD"'::jsonb, "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "OrgSetting" ("id", "companyId", "key", "value", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, company."id", 'currencySymbol', '"$"'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Company" company
ON CONFLICT ("companyId", "key") DO UPDATE SET "value" = '"$"'::jsonb, "updatedAt" = CURRENT_TIMESTAMP;
