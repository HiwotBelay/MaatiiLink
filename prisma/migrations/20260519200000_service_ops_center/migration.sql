-- Service Operations Coordination Center

CREATE TYPE "TicketCategory_new" AS ENUM (
  'IT',
  'FACILITIES',
  'CASH_LOGISTICS',
  'SECURITY_OPERATIONS',
  'NETWORK_OPERATIONS'
);

ALTER TABLE "ServiceTicket" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "ServiceTicket" ALTER COLUMN "category" TYPE "TicketCategory_new" USING (
  CASE "category"::text
    WHEN 'OTHER' THEN 'IT'::"TicketCategory_new"
    WHEN 'IT' THEN 'IT'::"TicketCategory_new"
    WHEN 'FACILITIES' THEN 'FACILITIES'::"TicketCategory_new"
    WHEN 'CASH_LOGISTICS' THEN 'CASH_LOGISTICS'::"TicketCategory_new"
    ELSE 'IT'::"TicketCategory_new"
  END
);
DROP TYPE "TicketCategory";
ALTER TYPE "TicketCategory_new" RENAME TO "TicketCategory";

CREATE TYPE "TicketStatus_new" AS ENUM (
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING',
  'ESCALATED',
  'RESOLVED',
  'CLOSED'
);

ALTER TABLE "ServiceTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ServiceTicket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING (
  CASE "status"::text
    WHEN 'OPEN' THEN 'OPEN'::"TicketStatus_new"
    WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::"TicketStatus_new"
    WHEN 'RESOLVED' THEN 'RESOLVED'::"TicketStatus_new"
    WHEN 'CLOSED' THEN 'CLOSED'::"TicketStatus_new"
    ELSE 'OPEN'::"TicketStatus_new"
  END
);
ALTER TABLE "ServiceTicket" ALTER COLUMN "status" SET DEFAULT 'OPEN';
DROP TYPE "TicketStatus";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";

ALTER TABLE "ServiceTicket" ADD COLUMN "ticketRef" TEXT;
ALTER TABLE "ServiceTicket" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ServiceTicket" ADD COLUMN "escalatedToId" TEXT;
ALTER TABLE "ServiceTicket" ADD COLUMN "slaResponseDueAt" TIMESTAMP(3);
ALTER TABLE "ServiceTicket" ADD COLUMN "slaResolutionDueAt" TIMESTAMP(3);
ALTER TABLE "ServiceTicket" ADD COLUMN "slaBreachedAt" TIMESTAMP(3);
ALTER TABLE "ServiceTicket" ADD COLUMN "firstResponseAt" TIMESTAMP(3);
ALTER TABLE "ServiceTicket" ADD COLUMN "escalatedAt" TIMESTAMP(3);

UPDATE "ServiceTicket"
SET "ticketRef" = 'TKT-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 8))
WHERE "ticketRef" IS NULL;

ALTER TABLE "ServiceTicket" ALTER COLUMN "ticketRef" SET NOT NULL;
CREATE UNIQUE INDEX "ServiceTicket_ticketRef_key" ON "ServiceTicket"("ticketRef");

UPDATE "ServiceTicket"
SET
  "slaResponseDueAt" = "createdAt" + INTERVAL '4 hours',
  "slaResolutionDueAt" = "createdAt" + (
    CASE "priority"::text
      WHEN 'URGENT' THEN INTERVAL '24 hours'
      WHEN 'HIGH' THEN INTERVAL '48 hours'
      WHEN 'MEDIUM' THEN INTERVAL '72 hours'
      ELSE INTERVAL '168 hours'
    END
  )
WHERE "slaResolutionDueAt" IS NULL;

ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_escalatedToId_fkey"
  FOREIGN KEY ("escalatedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TicketNote" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketNote_ticketId_idx" ON "TicketNote"("ticketId");
ALTER TABLE "TicketNote" ADD CONSTRAINT "TicketNote_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketNote" ADD CONSTRAINT "TicketNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ServiceTicket_category_status_idx" ON "ServiceTicket"("category", "status");
CREATE INDEX "ServiceTicket_assigneeId_idx" ON "ServiceTicket"("assigneeId");
CREATE INDEX "ServiceTicket_branchId_idx" ON "ServiceTicket"("branchId");
CREATE INDEX "ServiceTicket_priority_idx" ON "ServiceTicket"("priority");
CREATE INDEX "ServiceTicket_slaResolutionDueAt_idx" ON "ServiceTicket"("slaResolutionDueAt");
