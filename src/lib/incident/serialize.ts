import type { Branch, Incident, User, IncidentAttachment } from "@prisma/client";

type IncidentWithRelations = Incident & {
  branch?: Pick<Branch, "name" | "branchCode" | "region"> | null;
  reporter?: Pick<User, "name" | "email"> | null;
  assignee?: Pick<User, "name" | "email"> | null;
  attachments?: Pick<
    IncidentAttachment,
    "id" | "kind" | "fileName" | "mimeType" | "sizeBytes" | "createdAt"
  >[];
};

export function serializeIncident(incident: IncidentWithRelations) {
  return {
    id: incident.id,
    incidentRef: incident.incidentRef,
    branchId: incident.branchId,
    branch: incident.branch,
    region: incident.region,
    reporterId: incident.reporterId,
    reporter: incident.reporter,
    assigneeId: incident.assigneeId,
    assignee: incident.assignee,
    category: incident.category,
    severity: incident.severity,
    status: incident.status,
    title: incident.title,
    description: incident.description,
    complianceEscalated: incident.complianceEscalated,
    slaResponseDueAt: incident.slaResponseDueAt?.toISOString() ?? null,
    slaResolutionDueAt: incident.slaResolutionDueAt?.toISOString() ?? null,
    slaBreached: !!incident.slaBreachedAt,
    firstResponseAt: incident.firstResponseAt?.toISOString() ?? null,
    assignedAt: incident.assignedAt?.toISOString() ?? null,
    investigatingAt: incident.investigatingAt?.toISOString() ?? null,
    escalatedAt: incident.escalatedAt?.toISOString() ?? null,
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    archivedAt: incident.archivedAt?.toISOString() ?? null,
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    attachments: incident.attachments?.map((a) => ({
      id: a.id,
      kind: a.kind,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
