-- Phase 5: pilot branches and feedback log
ALTER TABLE "Branch" ADD COLUMN "isPilotBranch" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "PilotFeedbackCategory" AS ENUM ('BUG', 'UX', 'TRAINING', 'FEATURE', 'OTHER');
CREATE TYPE "PilotFeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SEV1');
CREATE TYPE "PilotFeedbackStatus" AS ENUM ('OPEN', 'TRIAGED', 'FIXED', 'WONTFIX');

CREATE TABLE "PilotFeedback" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "userId" TEXT,
    "category" "PilotFeedbackCategory" NOT NULL,
    "severity" "PilotFeedbackSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "PilotFeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PilotFeedback_status_idx" ON "PilotFeedback"("status");
CREATE INDEX "PilotFeedback_createdAt_idx" ON "PilotFeedback"("createdAt");

ALTER TABLE "PilotFeedback" ADD CONSTRAINT "PilotFeedback_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotFeedback" ADD CONSTRAINT "PilotFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
