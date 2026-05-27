import type { IncidentSeverity } from "@prisma/client";

/** Response SLA — time to first action (hours). */
const RESPONSE_HOURS: Record<IncidentSeverity, number> = {
  CRITICAL: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

/** Resolution SLA — time to resolve (hours). */
const RESOLUTION_HOURS: Record<IncidentSeverity, number> = {
  CRITICAL: 8,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

export function computeSlaDeadlines(
  severity: IncidentSeverity,
  createdAt: Date = new Date(),
): { slaResponseDueAt: Date; slaResolutionDueAt: Date } {
  const slaResponseDueAt = new Date(
    createdAt.getTime() + RESPONSE_HOURS[severity] * 60 * 60 * 1000,
  );
  const slaResolutionDueAt = new Date(
    createdAt.getTime() + RESOLUTION_HOURS[severity] * 60 * 60 * 1000,
  );
  return { slaResponseDueAt, slaResolutionDueAt };
}

export function isSlaOverdue(
  slaResolutionDueAt: Date | null,
  status: string,
): boolean {
  if (!slaResolutionDueAt) return false;
  if (status === "RESOLVED" || status === "ARCHIVED") return false;
  return slaResolutionDueAt.getTime() < Date.now();
}

export function averageResponseTimeMs(
  incidents: { createdAt: Date; firstResponseAt: Date | null }[],
): number | null {
  const samples = incidents
    .filter((i) => i.firstResponseAt)
    .map((i) => i.firstResponseAt!.getTime() - i.createdAt.getTime());
  if (samples.length === 0) return null;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}
