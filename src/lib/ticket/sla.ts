import { SLA_HOURS } from "./constants";

export function slaTargetHours(priority: string): number {
  return SLA_HOURS[priority] ?? SLA_HOURS.MEDIUM;
}

export function slaDueAt(createdAt: Date, priority: string): Date {
  const hours = slaTargetHours(priority);
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

export function slaHoursRemaining(createdAt: Date, priority: string, now = new Date()): number {
  const due = slaDueAt(createdAt, priority);
  const ms = due.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function isSlaBreached(
  createdAt: Date,
  priority: string,
  status: string,
  now = new Date(),
): boolean {
  if (status === "RESOLVED" || status === "CLOSED") return false;
  return now.getTime() > slaDueAt(createdAt, priority).getTime();
}
