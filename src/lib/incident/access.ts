import type { Incident, IncidentSeverity, Prisma, Role } from "@prisma/client";
import { hasPermission, Permission } from "@/lib/rbac";
import { COMPLIANCE_CATEGORIES } from "./constants";

export type IncidentViewer = {
  id: string;
  role: Role;
  branchId: string | null;
};

/** Map session (sub) or API user (id) into incident service context. */
export function toIncidentViewer(user: {
  id?: string;
  sub?: string;
  role: Role;
  branchId: string | null;
}): IncidentViewer {
  const id = user.id ?? user.sub;
  if (!id) throw new Error("Missing user id");
  return { id, role: user.role, branchId: user.branchId };
}

/** Prisma where clause for incidents visible to this user. */
export function incidentVisibilityFilter(
  user: IncidentViewer,
): Prisma.IncidentWhereInput {
  if (user.role === "COMPLIANCE_OFFICER") {
    return { complianceEscalated: true };
  }

  if (hasPermission(user.role, Permission.INCIDENT_VIEW_ALL)) {
    return {};
  }

  if (!user.branchId) {
    return { id: "__none__" };
  }

  return { branchId: user.branchId };
}

export function canViewIncident(
  user: IncidentViewer,
  incident: Pick<
    Incident,
    "branchId" | "severity" | "complianceEscalated"
  >,
): boolean {
  if (user.role === "COMPLIANCE_OFFICER") {
    return incident.complianceEscalated;
  }

  if (hasPermission(user.role, Permission.INCIDENT_VIEW_ALL)) {
    return true;
  }

  if (!user.branchId) return false;
  return incident.branchId === user.branchId;
}

export function shouldComplianceEscalate(
  severity: IncidentSeverity,
  category: string,
): boolean {
  return (
    severity === "CRITICAL" ||
    severity === "HIGH" ||
    COMPLIANCE_CATEGORIES.includes(category)
  );
}

export function canAssignIncidents(role: Role): boolean {
  return (
    hasPermission(role, Permission.INCIDENT_UPDATE) &&
    hasPermission(role, Permission.INCIDENT_VIEW_ALL)
  );
}
