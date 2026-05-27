import type { IncidentSeverity, IncidentStatus } from "@prisma/client";

export const INCIDENT_CATEGORIES = [
  "FRAUD_ATTEMPT",
  "SYSTEM_DOWNTIME",
  "CASH_VARIANCE",
  "SECURITY",
  "CUSTOMER_DISPUTE",
  "OTHER",
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const INCIDENT_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "INVESTIGATING",
  "ESCALATED",
  "RESOLVED",
  "ARCHIVED",
] as const;

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  INVESTIGATING: "Investigating",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
};

/** Workflow transitions — banking ops lifecycle */
export const STATUS_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  OPEN: ["ASSIGNED", "INVESTIGATING", "ESCALATED", "RESOLVED"],
  ASSIGNED: ["INVESTIGATING", "ESCALATED", "RESOLVED"],
  INVESTIGATING: ["ESCALATED", "RESOLVED"],
  ESCALATED: ["INVESTIGATING", "RESOLVED"],
  RESOLVED: ["ARCHIVED"],
  ARCHIVED: [],
};

export const COMPLIANCE_CATEGORIES: readonly string[] = [
  "FRAUD_ATTEMPT",
  "SECURITY",
];

export const TERMINAL_STATUSES: readonly IncidentStatus[] = [
  "RESOLVED",
  "ARCHIVED",
];

export const ACTIVE_STATUSES: readonly IncidentStatus[] = [
  "OPEN",
  "ASSIGNED",
  "INVESTIGATING",
  "ESCALATED",
];

export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;
