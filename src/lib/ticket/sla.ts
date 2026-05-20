import { SLA_HOURS, SLA_RESPONSE_HOURS, TERMINAL_STATUSES } from "./constants";
import type { TicketPriority, TicketStatus } from "@prisma/client";

export function slaTargetHours(priority: string): number {
  return SLA_HOURS[priority] ?? SLA_HOURS.MEDIUM;
}

export function computeSlaDeadlines(
  createdAt: Date,
  priority: TicketPriority,
): { responseDue: Date; resolutionDue: Date } {
  const resolutionMs = slaTargetHours(priority) * 60 * 60 * 1000;
  const responseMs = SLA_RESPONSE_HOURS * 60 * 60 * 1000;
  return {
    responseDue: new Date(createdAt.getTime() + responseMs),
    resolutionDue: new Date(createdAt.getTime() + resolutionMs),
  };
}

export function slaHoursRemaining(
  resolutionDue: Date | null,
  status: TicketStatus,
  now = new Date(),
): number {
  if (TERMINAL_STATUSES.includes(status) || !resolutionDue) return 0;
  const ms = resolutionDue.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function isSlaBreached(
  resolutionDue: Date | null,
  status: TicketStatus,
  slaBreachedAt: Date | null,
  now = new Date(),
): boolean {
  if (slaBreachedAt) return true;
  if (TERMINAL_STATUSES.includes(status) || !resolutionDue) return false;
  return now.getTime() > resolutionDue.getTime();
}

export function isResponseSlaBreached(
  responseDue: Date | null,
  firstResponseAt: Date | null,
  status: TicketStatus,
  now = new Date(),
): boolean {
  if (firstResponseAt || TERMINAL_STATUSES.includes(status) || !responseDue) {
    return false;
  }
  return now.getTime() > responseDue.getTime();
}
