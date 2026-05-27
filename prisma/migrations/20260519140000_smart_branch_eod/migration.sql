-- Smart Branch Operations Reporting System

CREATE TYPE "LiquidityStatus" AS ENUM ('ADEQUATE', 'WATCH', 'CRITICAL');

CREATE TYPE "EodStatus_new" AS ENUM (
  'PENDING',
  'SUBMITTED',
  'LATE',
  'ESCALATED',
  'REVIEWED'
);

CREATE TABLE "EodReportingWindow" (
  "id" TEXT NOT NULL,
  "branchId" TEXT,
  "region" TEXT,
  "cutoffHour" INTEGER NOT NULL DEFAULT 18,
  "cutoffMinute" INTEGER NOT NULL DEFAULT 0,
  "graceMinutes" INTEGER NOT NULL DEFAULT 30,
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EodReportingWindow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EodReportingWindow_branchId_idx" ON "EodReportingWindow"("branchId");
CREATE INDEX "EodReportingWindow_region_idx" ON "EodReportingWindow"("region");

ALTER TABLE "EodReportingWindow"
  ADD CONSTRAINT "EodReportingWindow_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New EOD columns
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3);
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "draftSavedAt" TIMESTAMP(3);
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "cashInflowBand" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "cashOutflowBand" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "liquidityStatus" "LiquidityStatus";
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "staffingIssues" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "atmDowntimeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "systemDowntimeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "operationalBlockers" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "securityConcerns" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "highValueTransactionNotes" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "performanceNotes" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "escalationReason" TEXT;
ALTER TABLE "EodReport" ADD COLUMN IF NOT EXISTS "complianceScore" INTEGER;

UPDATE "EodReport" SET "staffingIssues" = "staffingNotes" WHERE "staffingIssues" IS NULL AND "staffingNotes" IS NOT NULL;

ALTER TABLE "EodReport" DROP COLUMN IF EXISTS "staffingNotes";

ALTER TABLE "EodReport" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "EodReport"
  ALTER COLUMN "status" TYPE "EodStatus_new"
  USING (
    CASE "status"::text
      WHEN 'DRAFT' THEN 'PENDING'::"EodStatus_new"
      WHEN 'SUBMITTED' THEN 'SUBMITTED'::"EodStatus_new"
      WHEN 'LOCKED' THEN 'REVIEWED'::"EodStatus_new"
      ELSE 'PENDING'::"EodStatus_new"
    END
  );

DROP TYPE "EodStatus";
ALTER TYPE "EodStatus_new" RENAME TO "EodStatus";
ALTER TABLE "EodReport" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "EodReport"
  ADD CONSTRAINT "EodReport_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "EodReport_status_reportDate_idx" ON "EodReport"("status", "reportDate");
CREATE INDEX IF NOT EXISTS "EodReport_branchId_status_idx" ON "EodReport"("branchId", "status");

-- Default reporting windows (region-level defaults)
INSERT INTO "EodReportingWindow" ("id", "region", "cutoffHour", "cutoffMinute", "graceMinutes", "timezone", "updatedAt")
SELECT
  'win-default-addis',
  'Addis Ababa',
  18,
  0,
  30,
  'Africa/Addis_Ababa',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "EodReportingWindow" WHERE "id" = 'win-default-addis');

INSERT INTO "EodReportingWindow" ("id", "region", "cutoffHour", "cutoffMinute", "graceMinutes", "timezone", "updatedAt")
SELECT
  'win-default-oromia',
  'Oromia',
  18,
  0,
  45,
  'Africa/Addis_Ababa',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "EodReportingWindow" WHERE "id" = 'win-default-oromia');
