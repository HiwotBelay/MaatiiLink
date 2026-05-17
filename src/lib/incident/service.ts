import type { IncidentSeverity, IncidentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { notifyIncidentEscalation } from "@/lib/notifications/email";
import { STATUS_TRANSITIONS } from "./constants";
import type { IncidentCreateInput, IncidentUpdateInput } from "./validation";

export class IncidentError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

function resolveBranchId(user: { role: Role; branchId: string | null }) {
  if (!user.branchId) {
    throw new IncidentError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

const incidentInclude = {
  branch: { select: { name: true, branchCode: true } },
  reporter: { select: { name: true, email: true } },
} as const;

export async function listIncidents(
  user: { role: Role; branchId: string | null },
  filters?: { status?: IncidentStatus; severity?: IncidentSeverity },
) {
  const canViewAll = hasPermission(user.role, Permission.INCIDENT_VIEW_ALL);
  const branchId = canViewAll ? undefined : resolveBranchId(user);

  return prisma.incident.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: incidentInclude,
  });
}

export async function getIncidentById(
  user: { role: Role; branchId: string | null },
  id: string,
) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: incidentInclude,
  });
  if (!incident) return null;

  const canViewAll = hasPermission(user.role, Permission.INCIDENT_VIEW_ALL);
  if (!canViewAll && incident.branchId !== user.branchId) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }
  return incident;
}

export async function createIncident(
  user: { id: string; role: Role; branchId: string | null; name: string },
  input: IncidentCreateInput,
) {
  if (!hasPermission(user.role, Permission.INCIDENT_CREATE)) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }

  const branchId = resolveBranchId(user);

  const incident = await prisma.incident.create({
    data: {
      branchId,
      reporterId: user.id,
      category: input.category,
      severity: input.severity as IncidentSeverity,
      title: input.title.trim(),
      description: input.description.trim(),
    },
    include: incidentInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "INCIDENT_CREATE",
    entityType: "Incident",
    entityId: incident.id,
    metadata: {
      branchId,
      severity: incident.severity,
      category: incident.category,
    },
  });

  if (incident.severity === "CRITICAL") {
    void notifyIncidentEscalation({
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      branchName: incident.branch?.name ?? branchId,
      reporterName: user.name,
      event: "created",
    });
  }

  return incident;
}

export async function updateIncidentStatus(
  user: { id: string; role: Role; branchId: string | null; name: string },
  id: string,
  input: IncidentUpdateInput,
) {
  if (!hasPermission(user.role, Permission.INCIDENT_UPDATE)) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: incidentInclude,
  });
  if (!incident) throw new IncidentError("Not found", "NOT_FOUND");

  const canViewAll = hasPermission(user.role, Permission.INCIDENT_VIEW_ALL);
  if (!canViewAll && incident.branchId !== user.branchId) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }

  const nextStatus = input.status as IncidentStatus;
  const allowed = STATUS_TRANSITIONS[incident.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new IncidentError(
      `Cannot transition from ${incident.status} to ${nextStatus}`,
      "INVALID_TRANSITION",
    );
  }

  const resolvedAt =
    nextStatus === "RESOLVED" || nextStatus === "CLOSED"
      ? new Date()
      : incident.resolvedAt;

  const updated = await prisma.incident.update({
    where: { id },
    data: { status: nextStatus, resolvedAt },
    include: incidentInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "INCIDENT_STATUS_CHANGE",
    entityType: "Incident",
    entityId: incident.id,
    metadata: { from: incident.status, to: nextStatus },
  });

  if (
    nextStatus === "ESCALATED" ||
    (incident.severity === "CRITICAL" && nextStatus !== incident.status)
  ) {
    void notifyIncidentEscalation({
      incidentId: updated.id,
      title: updated.title,
      severity: updated.severity,
      branchName: updated.branch?.name ?? updated.branchId,
      reporterName: user.name,
      event: nextStatus === "ESCALATED" ? "escalated" : "updated",
    });
  }

  return updated;
}

export async function countOpenIncidentsForBranch(branchId: string) {
  return prisma.incident.count({
    where: {
      branchId,
      status: { in: ["OPEN", "ESCALATED"] },
    },
  });
}

export async function countCriticalOpenIncidents() {
  return prisma.incident.count({
    where: {
      severity: "CRITICAL",
      status: { in: ["OPEN", "ESCALATED"] },
    },
  });
}
