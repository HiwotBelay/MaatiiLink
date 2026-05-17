/** SLA target hours by priority (PRD TKT-4). */
export const SLA_HOURS: Record<string, number> = {
  URGENT: 24,
  HIGH: 48,
  MEDIUM: 72,
  LOW: 168,
};

export const TICKET_CATEGORIES = ["IT", "FACILITIES", "CASH_LOGISTICS", "OTHER"] as const;
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export const TICKET_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
