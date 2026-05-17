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

export const INCIDENT_STATUSES = ["OPEN", "ESCALATED", "RESOLVED", "CLOSED"] as const;

/** Allowed status transitions. */
export const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  OPEN: ["ESCALATED", "RESOLVED", "CLOSED"],
  ESCALATED: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
