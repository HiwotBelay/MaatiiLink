-- Operational Knowledge & Procedures Center

CREATE TYPE "DirectiveCategory" AS ENUM (
  'CASH_OPERATIONS',
  'LOAN_PROCEDURES',
  'COMPLIANCE',
  'TREASURY',
  'SECURITY',
  'CUSTOMER_OPERATIONS',
  'ATM_OPERATIONS',
  'EMERGENCY_PROCEDURES'
);

CREATE TYPE "DirectivePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "Directive" ADD COLUMN "summary" TEXT;
ALTER TABLE "Directive" ADD COLUMN "category" "DirectiveCategory" NOT NULL DEFAULT 'COMPLIANCE';
ALTER TABLE "Directive" ADD COLUMN "priority" "DirectivePriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Directive" ADD COLUMN "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Directive" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Directive" ADD COLUMN "isMandatory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Directive" ADD COLUMN "isSop" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Directive" SET "priority" = 'CRITICAL' WHERE "isCritical" = true;

CREATE TABLE "DirectiveRead" (
  "id" TEXT NOT NULL,
  "directiveId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectiveRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectiveRead_directiveId_userId_key" ON "DirectiveRead"("directiveId", "userId");
CREATE INDEX "DirectiveRead_userId_idx" ON "DirectiveRead"("userId");

ALTER TABLE "DirectiveRead" ADD CONSTRAINT "DirectiveRead_directiveId_fkey"
  FOREIGN KEY ("directiveId") REFERENCES "Directive"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectiveRead" ADD CONSTRAINT "DirectiveRead_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Directive_category_idx" ON "Directive"("category");
CREATE INDEX "Directive_priority_idx" ON "Directive"("priority");
CREATE INDEX "Directive_isPinned_idx" ON "Directive"("isPinned");
CREATE INDEX "Directive_publishedAt_idx" ON "Directive"("publishedAt");
CREATE INDEX "Directive_isMandatory_idx" ON "Directive"("isMandatory");
