-- Banking operational incident management

CREATE TYPE "IncidentAttachmentKind" AS ENUM ('SCREENSHOT', 'PDF', 'EVIDENCE');

CREATE TYPE "IncidentStatus_new" AS ENUM (
  'OPEN',
  'ASSIGNED',
  'INVESTIGATING',
  'ESCALATED',
  'RESOLVED',
  'ARCHIVED'
);

ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "incidentRef" TEXT;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "complianceEscalated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "slaResponseDueAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "slaResolutionDueAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "slaBreachedAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "investigatingAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

UPDATE "Incident" SET "incidentRef" = 'INC-LEGACY-' || "id" WHERE "incidentRef" IS NULL;
ALTER TABLE "Incident" ALTER COLUMN "incidentRef" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Incident_incidentRef_key" ON "Incident"("incidentRef");

UPDATE "Incident" SET "complianceEscalated" = true
WHERE "severity" IN ('CRITICAL', 'HIGH')
   OR "category" IN ('FRAUD_ATTEMPT', 'SECURITY');

ALTER TABLE "Incident" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Incident"
  ALTER COLUMN "status" TYPE "IncidentStatus_new"
  USING (
    CASE "status"::text
      WHEN 'OPEN' THEN 'OPEN'::"IncidentStatus_new"
      WHEN 'ESCALATED' THEN 'ESCALATED'::"IncidentStatus_new"
      WHEN 'RESOLVED' THEN 'RESOLVED'::"IncidentStatus_new"
      WHEN 'CLOSED' THEN 'ARCHIVED'::"IncidentStatus_new"
      ELSE 'OPEN'::"IncidentStatus_new"
    END
  );

DROP TYPE "IncidentStatus";
ALTER TYPE "IncidentStatus_new" RENAME TO "IncidentStatus";
ALTER TABLE "Incident" ALTER COLUMN "status" SET DEFAULT 'OPEN';

ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Incident_branchId_status_idx" ON "Incident"("branchId", "status");
CREATE INDEX IF NOT EXISTS "Incident_region_status_idx" ON "Incident"("region", "status");
CREATE INDEX IF NOT EXISTS "Incident_severity_status_idx" ON "Incident"("severity", "status");
CREATE INDEX IF NOT EXISTS "Incident_complianceEscalated_idx" ON "Incident"("complianceEscalated");
CREATE INDEX IF NOT EXISTS "Incident_slaResolutionDueAt_idx" ON "Incident"("slaResolutionDueAt");

CREATE TABLE "IncidentAttachment" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "kind" "IncidentAttachmentKind" NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IncidentAttachment_incidentId_idx" ON "IncidentAttachment"("incidentId");

ALTER TABLE "IncidentAttachment"
  ADD CONSTRAINT "IncidentAttachment_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IncidentAttachment"
  ADD CONSTRAINT "IncidentAttachment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
