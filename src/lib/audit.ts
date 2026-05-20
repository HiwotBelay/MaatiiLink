import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { RequestSecurityContext } from "@/lib/security/request-context";

export const AuditModule = {
  AUTH: "AUTH",
  EOD: "EOD",
  INCIDENT: "INCIDENT",
  DIRECTIVE: "DIRECTIVE",
  TICKET: "TICKET",
  ADMIN: "ADMIN",
  AUDIT: "AUDIT",
  PILOT: "PILOT",
  OPS: "OPS",
  SECURITY: "SECURITY",
  SYSTEM: "SYSTEM",
} as const;

export type AuditModuleKey = (typeof AuditModule)[keyof typeof AuditModule];

export type AuditLogInput = {
  userId?: string;
  action: string;
  module?: AuditModuleKey;
  entityType: string;
  entityId?: string;
  branchId?: string | null;
  previousValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  request?: RequestSecurityContext;
};

function inferModule(entityType: string): AuditModuleKey {
  const map: Record<string, AuditModuleKey> = {
    User: AuditModule.AUTH,
    UserSession: AuditModule.SECURITY,
    EodReport: AuditModule.EOD,
    Incident: AuditModule.INCIDENT,
    Directive: AuditModule.DIRECTIVE,
    ServiceTicket: AuditModule.TICKET,
    Branch: AuditModule.ADMIN,
    PilotFeedback: AuditModule.PILOT,
  };
  return map[entityType] ?? AuditModule.SYSTEM;
}

export async function writeAuditLog(input: AuditLogInput) {
  const deviceMeta = input.request
    ? {
        ipAddress: input.request.ipAddress,
        userAgent: input.request.userAgent,
        deviceLabel: input.request.deviceLabel,
      }
    : undefined;

  const metadata =
    input.metadata || deviceMeta
      ? {
          ...(typeof input.metadata === "object" && input.metadata !== null
            ? (input.metadata as Record<string, unknown>)
            : {}),
          ...(deviceMeta ?? {}),
        }
      : undefined;

  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      module: input.module ?? inferModule(input.entityType),
      entityType: input.entityType,
      entityId: input.entityId,
      branchId: input.branchId ?? undefined,
      previousValue: input.previousValue,
      newValue: input.newValue,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

/** Helper for entity updates with before/after snapshots. */
export async function writeAuditChange(input: {
  userId: string;
  action: string;
  module: AuditModuleKey;
  entityType: string;
  entityId: string;
  branchId?: string | null;
  previous: unknown;
  next: unknown;
  request?: RequestSecurityContext;
}) {
  return writeAuditLog({
    userId: input.userId,
    action: input.action,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    branchId: input.branchId,
    previousValue: input.previous as Prisma.InputJsonValue,
    newValue: input.next as Prisma.InputJsonValue,
    request: input.request,
  });
}
