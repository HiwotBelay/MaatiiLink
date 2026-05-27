import type { Role, TicketCategory, TicketStatus } from "@prisma/client";

/** SLA resolution target hours by priority. */
export const SLA_HOURS: Record<string, number> = {
  URGENT: 24,
  HIGH: 48,
  MEDIUM: 72,
  LOW: 168,
};

/** First-response SLA (hours). */
export const SLA_RESPONSE_HOURS = 4;

export const TICKET_DEPARTMENTS: readonly TicketCategory[] = [
  "IT",
  "FACILITIES",
  "CASH_LOGISTICS",
  "SECURITY_OPERATIONS",
  "NETWORK_OPERATIONS",
] as const;

export const DEPARTMENT_LABELS: Record<TicketCategory, string> = {
  IT: "IT Support",
  FACILITIES: "Facilities",
  CASH_LOGISTICS: "Cash Logistics",
  SECURITY_OPERATIONS: "Security Operations",
  NETWORK_OPERATIONS: "Network Operations",
};

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const TICKET_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
] as const;

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  WAITING: "Waiting",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TICKET_STATUS_TRANSITIONS: Record<
  TicketStatus,
  readonly TicketStatus[]
> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "WAITING", "ESCALATED", "RESOLVED"],
  ASSIGNED: ["IN_PROGRESS", "WAITING", "ESCALATED", "RESOLVED"],
  IN_PROGRESS: ["WAITING", "ESCALATED", "RESOLVED"],
  WAITING: ["IN_PROGRESS", "ESCALATED", "RESOLVED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export const ACTIVE_STATUSES: readonly TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING",
  "ESCALATED",
];

export const TERMINAL_STATUSES: readonly TicketStatus[] = ["RESOLVED", "CLOSED"];

/** Department → roles that may be assigned from the queue. */
export const DEPARTMENT_ASSIGN_ROLES: Record<TicketCategory, readonly Role[]> = {
  IT: ["IT_SUPPORT", "HO_OPERATIONS", "SUPER_ADMIN"],
  NETWORK_OPERATIONS: ["IT_SUPPORT", "HO_OPERATIONS", "SUPER_ADMIN"],
  FACILITIES: ["HO_OPERATIONS", "REGIONAL_SUPERVISOR", "SUPER_ADMIN"],
  CASH_LOGISTICS: ["HO_OPERATIONS", "REGIONAL_SUPERVISOR", "SUPER_ADMIN"],
  SECURITY_OPERATIONS: [
    "HO_OPERATIONS",
    "COMPLIANCE_OFFICER",
    "SUPER_ADMIN",
  ],
};

/** Escalation chain (next tier roles). */
export const ESCALATION_CHAIN: Record<TicketCategory, readonly Role[]> = {
  IT: ["HO_OPERATIONS", "SUPER_ADMIN"],
  NETWORK_OPERATIONS: ["HO_OPERATIONS", "SUPER_ADMIN"],
  FACILITIES: ["REGIONAL_SUPERVISOR", "HO_OPERATIONS"],
  CASH_LOGISTICS: ["REGIONAL_SUPERVISOR", "HO_OPERATIONS"],
  SECURITY_OPERATIONS: ["COMPLIANCE_OFFICER", "HO_OPERATIONS", "SUPER_ADMIN"],
};
