import type { IncidentSeverity, IncidentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditModule, writeAuditChange, writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import {
  incidentVisibilityFilter,
  canViewIncident,
  shouldComplianceEscalate,
  canAssignIncidents,
  type IncidentViewer,
} from "./access";
import { STATUS_TRANSITIONS, ACTIVE_STATUSES, TERMINAL_STATUSES } from "./constants";
import { computeSlaDeadlines, isSlaOverdue } from "./sla";
import {
  notifyIncidentStakeholders,
  notifyAssignee,
} from "@/lib/notifications/incident-notify";
import type { IncidentCreateInput, IncidentUpdateInput } from "./validation";

export class IncidentError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const incidentInclude = {
  branch: { select: { name: true, branchCode: true, region: true } },
  reporter: { select: { name: true, email: true } },
  assignee: { select: { name: true, email: true } },
  attachments: {
    select: {
      id: true,
      kind: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

async function generateIncidentRef(): Promise<string> {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  })
    .format(new Date())
    .replace(/-/g, "");
  const prefix = `INC-${date}-`;
  const latest = await prisma.incident.findFirst({
    where: { incidentRef: { startsWith: prefix } },
    orderBy: { incidentRef: "desc" },
    select: { incidentRef: true },
  });
  const seq = latest
    ? Number(latest.incidentRef.slice(prefix.length)) + 1
    : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

function resolveBranchId(user: IncidentViewer) {
  if (hasPermission(user.role, Permission.INCIDENT_VIEW_ALL)) {
    throw new IncidentError("Specify branch via branch role", "NO_BRANCH");
  }
  if (!user.branchId) {
    throw new IncidentError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

async function processSlaBreaches(user: IncidentViewer) {
  const visibility = incidentVisibilityFilter(user);
  const overdue = await prisma.incident.findMany({
    where: {
      AND: [
        visibility,
        { status: { in: [...ACTIVE_STATUSES] } },
        { slaResolutionDueAt: { lt: new Date() } },
        { slaBreachedAt: null },
      ],
    },
    include: incidentInclude,
  });

  for (const incident of overdue) {
    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        slaBreachedAt: new Date(),
        status:
          incident.status === "OPEN" || incident.status === "ASSIGNED"
            ? "ESCALATED"
            : incident.status,
        escalatedAt: incident.escalatedAt ?? new Date(),
        complianceEscalated: true,
      },
      include: incidentInclude,
    });

    void notifyIncidentStakeholders({
      incidentId: updated.id,
      incidentRef: updated.incidentRef,
      title: updated.title,
      severity: updated.severity,
      branchName: updated.branch?.name ?? updated.branchId,
      reporterName: updated.reporter?.name ?? "System",
      event: "sla_breach",
    });
  }
}

export async function listIncidents(
  user: IncidentViewer,
  filters?: { status?: IncidentStatus; severity?: IncidentSeverity; region?: string },
) {
  await processSlaBreaches(user);

  const visibility = incidentVisibilityFilter(user);

  return prisma.incident.findMany({
    where: {
      AND: [
        visibility,
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.severity ? [{ severity: filters.severity }] : []),
        ...(filters?.region ? [{ region: filters.region }] : []),
      ],
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: incidentInclude,
  });
}

export async function getIncidentById(user: IncidentViewer, id: string) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: incidentInclude,
  });
  if (!incident) return null;

  if (!canViewIncident(user, incident)) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }
  return incident;
}

export async function createIncident(
  user: IncidentViewer & { name: string },
  input: IncidentCreateInput,
) {
  if (!hasPermission(user.role, Permission.INCIDENT_CREATE)) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }

  const branchId = resolveBranchId(user);
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { region: true, name: true },
  });

  const severity = input.severity as IncidentSeverity;
  const { slaResponseDueAt, slaResolutionDueAt } = computeSlaDeadlines(severity);
  const complianceEscalated = shouldComplianceEscalate(severity, input.category);
  const incidentRef = await generateIncidentRef();

  const incident = await prisma.incident.create({
    data: {
      incidentRef,
      branchId,
      region: branch?.region ?? null,
      reporterId: user.id,
      category: input.category,
      severity,
      title: input.title.trim(),
      description: input.description.trim(),
      complianceEscalated,
      slaResponseDueAt,
      slaResolutionDueAt,
    },
    include: incidentInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "INCIDENT_CREATE",
    module: AuditModule.INCIDENT,
    entityType: "Incident",
    entityId: incident.id,
    branchId,
    newValue: {
      incidentRef,
      severity: incident.severity,
      category: incident.category,
    },
  });

  if (severity === "CRITICAL" || complianceEscalated) {
    void notifyIncidentStakeholders({
      incidentId: incident.id,
      incidentRef: incident.incidentRef,
      title: incident.title,
      severity: incident.severity,
      branchName: incident.branch?.name ?? branchId,
      reporterName: user.name,
      event: severity === "CRITICAL" ? "critical" : "created",
    });
  }

  return incident;
}

function statusTimestamps(
  nextStatus: IncidentStatus,
  now: Date,
): Record<string, Date | undefined> {
  switch (nextStatus) {
    case "ASSIGNED":
      return { assignedAt: now, firstResponseAt: now };
    case "INVESTIGATING":
      return { investigatingAt: now, firstResponseAt: now };
    case "ESCALATED":
      return { escalatedAt: now, firstResponseAt: now };
    case "RESOLVED":
      return { resolvedAt: now };
    case "ARCHIVED":
      return { archivedAt: now, resolvedAt: now };
    default:
      return {};
  }
}

export async function updateIncident(
  user: IncidentViewer & { name: string },
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

  if (!canViewIncident(user, incident)) {
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

  const now = new Date();
  const timestamps = statusTimestamps(nextStatus, now);

  let assigneeId = incident.assigneeId;
  let effectiveStatus = nextStatus;

  if (input.assigneeId !== undefined) {
    if (!canAssignIncidents(user.role)) {
      throw new IncidentError("Cannot assign incidents", "FORBIDDEN");
    }
    assigneeId = input.assigneeId;
    if (assigneeId && nextStatus === "OPEN") {
      effectiveStatus = "ASSIGNED";
      Object.assign(timestamps, {
        assignedAt: now,
        firstResponseAt: incident.firstResponseAt ?? now,
      });
    }
  } else if (nextStatus === "ASSIGNED" && !assigneeId && canAssignIncidents(user.role)) {
    assigneeId = user.id;
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      status: effectiveStatus,
      assigneeId,
      ...timestamps,
      complianceEscalated:
        incident.complianceEscalated ||
        nextStatus === "ESCALATED" ||
        shouldComplianceEscalate(incident.severity, incident.category),
    },
    include: incidentInclude,
  });

  await writeAuditChange({
    userId: user.id,
    action: "INCIDENT_STATUS_CHANGE",
    module: AuditModule.INCIDENT,
    entityType: "Incident",
    entityId: incident.id,
    branchId: incident.branchId,
    previous: { status: incident.status, assigneeId: incident.assigneeId },
    next: { status: updated.status, assigneeId: updated.assigneeId },
  });

  const notifyPayload = {
    incidentId: updated.id,
    incidentRef: updated.incidentRef,
    title: updated.title,
    severity: updated.severity,
    branchName: updated.branch?.name ?? updated.branchId,
    reporterName: user.name,
  };

  if (nextStatus === "ESCALATED" || updated.severity === "CRITICAL") {
    void notifyIncidentStakeholders({
      ...notifyPayload,
      event: nextStatus === "ESCALATED" ? "escalated" : "critical",
    });
  }

  if (assigneeId && assigneeId !== incident.assigneeId) {
    void notifyAssignee(assigneeId, { ...notifyPayload, event: "assigned" });
  }

  return updated;
}

/** @deprecated use updateIncident */
export async function updateIncidentStatus(
  user: IncidentViewer & { name: string },
  id: string,
  input: { status: string },
) {
  return updateIncident(user, id, { status: input.status as IncidentStatus });
}

export async function countOpenIncidentsForBranch(branchId: string) {
  return prisma.incident.count({
    where: {
      branchId,
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
}

export async function countCriticalOpenIncidents() {
  return prisma.incident.count({
    where: {
      severity: "CRITICAL",
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
}

export async function addIncidentAttachment(
  user: IncidentViewer,
  incidentId: string,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  if (
    !hasPermission(user.role, Permission.INCIDENT_CREATE) &&
    !hasPermission(user.role, Permission.INCIDENT_UPDATE)
  ) {
    throw new IncidentError("Forbidden", "FORBIDDEN");
  }

  const incident = await getIncidentById(user, incidentId);
  if (!incident) throw new IncidentError("Not found", "NOT_FOUND");

  if (TERMINAL_STATUSES.includes(incident.status)) {
    throw new IncidentError("Cannot attach to closed incident", "NOT_EDITABLE");
  }

  const { saveIncidentAttachment } = await import("./storage");
  const { storageKey, kind } = await saveIncidentAttachment(
    incidentId,
    file.name,
    file.mimeType,
    file.buffer,
  );

  const attachment = await prisma.incidentAttachment.create({
    data: {
      incidentId,
      uploadedById: user.id,
      kind,
      fileName: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      storageKey,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "INCIDENT_ATTACHMENT_ADD",
    module: AuditModule.INCIDENT,
    entityType: "Incident",
    entityId: incidentId,
    metadata: { fileName: file.name, kind },
  });

  return attachment;
}

export { isSlaOverdue };
