import type { Branch, Incident, User } from "@prisma/client";

type IncidentWithRelations = Incident & {
  branch?: Pick<Branch, "name" | "branchCode"> | null;
  reporter?: Pick<User, "name" | "email"> | null;
};

export function serializeIncident(incident: IncidentWithRelations) {
  return {
    id: incident.id,
    branchId: incident.branchId,
    branch: incident.branch,
    reporterId: incident.reporterId,
    reporter: incident.reporter,
    category: incident.category,
    severity: incident.severity,
    status: incident.status,
    title: incident.title,
    description: incident.description,
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
  };
}
