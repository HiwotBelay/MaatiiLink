-- Enterprise security: roles, sessions, login activity, enhanced audit log

-- Migrate Role enum to enterprise roles
CREATE TYPE "Role_new" AS ENUM (
  'BRANCH_STAFF',
  'BRANCH_MANAGER',
  'REGIONAL_SUPERVISOR',
  'HO_OPERATIONS',
  'COMPLIANCE_OFFICER',
  'IT_SUPPORT',
  'AUDITOR_READ_ONLY',
  'SUPER_ADMIN'
);

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'BRANCH_STAFF' THEN 'BRANCH_STAFF'
      WHEN 'BRANCH_MANAGER' THEN 'BRANCH_MANAGER'
      WHEN 'SUPERVISOR' THEN 'REGIONAL_SUPERVISOR'
      WHEN 'HO_ADMIN' THEN 'HO_OPERATIONS'
      WHEN 'AUDITOR' THEN 'AUDITOR_READ_ONLY'
      ELSE 'BRANCH_STAFF'
    END::"Role_new"
  );

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- User security fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- User sessions
CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceLabel" TEXT,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

ALTER TABLE "UserSession"
  ADD CONSTRAINT "UserSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Login activity
CREATE TABLE "LoginActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "failureReason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "branchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginActivity_userId_createdAt_idx" ON "LoginActivity"("userId", "createdAt");
CREATE INDEX "LoginActivity_email_createdAt_idx" ON "LoginActivity"("email", "createdAt");
CREATE INDEX "LoginActivity_createdAt_idx" ON "LoginActivity"("createdAt");

ALTER TABLE "LoginActivity"
  ADD CONSTRAINT "LoginActivity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit log enhancements
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "module" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "previousValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "newValue" JSONB;

UPDATE "AuditLog" SET "module" = 'SYSTEM' WHERE "module" IS NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "module" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_branchId_createdAt_idx" ON "AuditLog"("branchId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Immutable audit log (no UPDATE/DELETE)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog records are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON "AuditLog";
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
