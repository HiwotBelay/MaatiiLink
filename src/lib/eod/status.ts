import type { EodStatus } from "@prisma/client";

export const EOD_STATUS_LABELS: Record<EodStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  LATE: "Late",
  ESCALATED: "Escalated",
  REVIEWED: "Reviewed",
};

export function isEditableStatus(status: EodStatus): boolean {
  return status === "PENDING";
}

export function canSubmitStatus(status: EodStatus): boolean {
  return status === "PENDING";
}

export function canReviewStatus(status: EodStatus): boolean {
  return status === "SUBMITTED" || status === "LATE" || status === "ESCALATED";
}

export function computeComplianceScore(input: {
  status: EodStatus;
  submittedAt: Date | null;
  dueAt: Date | null;
  complaintCount: number;
  atmDowntimeMinutes: number;
  systemDowntimeMinutes: number;
  liquidityStatus: string | null;
}): number {
  let score = 100;

  if (input.status === "PENDING" && input.dueAt && input.dueAt < new Date()) {
    score -= 40;
  } else if (input.status === "LATE") {
    score -= 25;
  } else if (input.status === "ESCALATED") {
    score -= 35;
  }

  if (input.complaintCount > 5) score -= 10;
  else if (input.complaintCount > 2) score -= 5;

  const downtime = input.atmDowntimeMinutes + input.systemDowntimeMinutes;
  if (downtime > 120) score -= 15;
  else if (downtime > 30) score -= 8;

  if (input.liquidityStatus === "CRITICAL") score -= 20;
  else if (input.liquidityStatus === "WATCH") score -= 10;

  return Math.max(0, Math.min(100, score));
}
