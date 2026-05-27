import type { EodStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditModule, writeAuditChange, writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { assertBranchAccess } from "@/lib/security/branch-access";
import { getAddisDateString, parseReportDate } from "./constants";
import type { EodFormInput } from "./validation";
import { resolveReportingWindow, computeDueAt, isPastDue } from "./window";
import {
  canReviewStatus,
  canSubmitStatus,
  computeComplianceScore,
  isEditableStatus,
} from "./status";

export class EodError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

function resolveBranchId(user: { role: Role; branchId: string | null }, branchIdParam?: string | null) {
  if (hasPermission(user.role, Permission.EOD_VIEW_ALL) && branchIdParam) {
    return branchIdParam;
  }
  if (!user.branchId) {
    throw new EodError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

function mapFormToData(input: EodFormInput) {
  return {
    openingCashBand: input.openingCashBand ?? null,
    closingCashBand: input.closingCashBand ?? null,
    cashInflowBand: input.cashInflowBand ?? null,
    cashOutflowBand: input.cashOutflowBand ?? null,
    liquidityStatus: input.liquidityStatus ?? null,
    complaintCount: input.complaintCount ?? 0,
    staffingIssues: input.staffingIssues?.trim() || null,
    atmDowntimeMinutes: input.atmDowntimeMinutes ?? 0,
    systemDowntimeMinutes: input.systemDowntimeMinutes ?? 0,
    operationalBlockers: input.operationalBlockers?.trim() || null,
    securityConcerns: input.securityConcerns?.trim() || null,
    highValueTransactionNotes: input.highValueTransactionNotes?.trim() || null,
    performanceNotes: input.performanceNotes?.trim() || null,
    anomalyNotes: input.anomalyNotes?.trim() || null,
  };
}

const reportInclude = {
  branch: { select: { name: true, branchCode: true, region: true } },
  submittedBy: { select: { name: true } },
  reviewedBy: { select: { name: true } },
} as const;

export async function listEodReports(
  user: { role: Role; branchId: string | null },
  options?: { branchId?: string; days?: number },
) {
  const days = options?.days ?? 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const canViewAll = hasPermission(user.role, Permission.EOD_VIEW_ALL);
  const branchId = canViewAll
    ? options?.branchId
    : resolveBranchId(user, options?.branchId);

  return prisma.eodReport.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      reportDate: { gte: since },
    },
    orderBy: { reportDate: "desc" },
    include: reportInclude,
  });
}

export async function getEodById(
  user: { role: Role; branchId: string | null },
  id: string,
) {
  const report = await prisma.eodReport.findUnique({
    where: { id },
    include: reportInclude,
  });
  if (!report) return null;

  const canViewAll = hasPermission(user.role, Permission.EOD_VIEW_ALL);
  if (!canViewAll && report.branchId !== user.branchId) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }
  return report;
}

export async function getTodayEod(
  user: { role: Role; branchId: string | null },
  branchIdParam?: string,
) {
  const branchId = resolveBranchId(user, branchIdParam);
  const today = getAddisDateString();
  return prisma.eodReport.findUnique({
    where: {
      branchId_reportDate: {
        branchId,
        reportDate: parseReportDate(today),
      },
    },
    include: reportInclude,
  });
}

export async function ensureTodayEod(
  user: { role: Role; branchId: string | null },
  branchIdParam?: string,
) {
  const existing = await getTodayEod(user, branchIdParam);
  if (existing) return existing;

  const branchId = resolveBranchId(user, branchIdParam);
  const today = getAddisDateString();
  const window = await resolveReportingWindow(branchId);
  const dueAt = computeDueAt(today, window);

  return prisma.eodReport.create({
    data: {
      branchId,
      reportDate: parseReportDate(today),
      status: "PENDING",
      dueAt,
    },
    include: reportInclude,
  });
}

export async function upsertEodDraft(
  user: { id: string; role: Role; branchId: string | null },
  input: EodFormInput,
  branchIdParam?: string,
) {
  if (!hasPermission(user.role, Permission.EOD_DRAFT)) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  const branchId = resolveBranchId(user, branchIdParam);
  const reportDate = parseReportDate(input.reportDate);
  const window = await resolveReportingWindow(branchId);
  const dueAt = computeDueAt(input.reportDate, window);

  const existing = await prisma.eodReport.findUnique({
    where: { branchId_reportDate: { branchId, reportDate } },
  });

  if (existing && !isEditableStatus(existing.status)) {
    throw new EodError("Report is no longer editable", "NOT_EDITABLE");
  }

  const data = {
    ...mapFormToData(input),
    status: "PENDING" as EodStatus,
    dueAt,
    draftSavedAt: new Date(),
    complianceScore: computeComplianceScore({
      status: "PENDING",
      submittedAt: null,
      dueAt,
      complaintCount: input.complaintCount ?? 0,
      atmDowntimeMinutes: input.atmDowntimeMinutes ?? 0,
      systemDowntimeMinutes: input.systemDowntimeMinutes ?? 0,
      liquidityStatus: input.liquidityStatus ?? null,
    }),
  };

  if (existing) {
    const updated = await prisma.eodReport.update({
      where: { id: existing.id },
      data,
      include: reportInclude,
    });
    await writeAuditLog({
      userId: user.id,
      action: "EOD_DRAFT_SAVE",
      module: AuditModule.EOD,
      entityType: "EodReport",
      entityId: updated.id,
      branchId,
      newValue: { reportDate: reportDate.toISOString() },
    });
    return updated;
  }

  const created = await prisma.eodReport.create({
    data: {
      branchId,
      reportDate,
      ...data,
    },
    include: reportInclude,
  });
  await writeAuditLog({
    userId: user.id,
    action: "EOD_DRAFT_SAVE",
    module: AuditModule.EOD,
    entityType: "EodReport",
    entityId: created.id,
    branchId,
  });
  return created;
}

export async function submitEod(
  user: { id: string; role: Role; branchId: string | null },
  reportId: string,
) {
  if (!hasPermission(user.role, Permission.EOD_SUBMIT)) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
  if (!report) throw new EodError("Not found", "NOT_FOUND");

  try {
    assertBranchAccess(user, report.branchId);
  } catch {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  if (!canSubmitStatus(report.status)) {
    throw new EodError("Only pending reports can be submitted", "NOT_PENDING");
  }

  const hasCash =
    (report.cashInflowBand || report.openingCashBand) &&
    (report.cashOutflowBand || report.closingCashBand);
  if (!hasCash) {
    throw new EodError(
      "Cash inflow/outflow (or opening/closing bands) required before submit",
      "VALIDATION",
    );
  }

  const late = report.dueAt ? isPastDue(report.dueAt) : false;
  const nextStatus: EodStatus = late ? "LATE" : "SUBMITTED";

  const updated = await prisma.eodReport.update({
    where: { id: reportId },
    data: {
      status: nextStatus,
      submittedById: user.id,
      submittedAt: new Date(),
      complianceScore: computeComplianceScore({
        status: nextStatus,
        submittedAt: new Date(),
        dueAt: report.dueAt,
        complaintCount: report.complaintCount,
        atmDowntimeMinutes: report.atmDowntimeMinutes,
        systemDowntimeMinutes: report.systemDowntimeMinutes,
        liquidityStatus: report.liquidityStatus,
      }),
    },
    include: reportInclude,
  });

  await writeAuditChange({
    userId: user.id,
    action: "EOD_SUBMIT",
    module: AuditModule.EOD,
    entityType: "EodReport",
    entityId: report.id,
    branchId: report.branchId,
    previous: { status: report.status },
    next: { status: nextStatus, late },
  });

  return updated;
}

export async function reviewEod(
  user: { id: string; role: Role },
  reportId: string,
) {
  if (!hasPermission(user.role, Permission.EOD_LOCK)) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
  if (!report) throw new EodError("Not found", "NOT_FOUND");

  if (!canReviewStatus(report.status)) {
    throw new EodError("Report cannot be reviewed in current status", "NOT_REVIEWABLE");
  }

  const updated = await prisma.eodReport.update({
    where: { id: reportId },
    data: {
      status: "REVIEWED",
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
    include: reportInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "EOD_REVIEW",
    module: AuditModule.EOD,
    entityType: "EodReport",
    entityId: report.id,
    branchId: report.branchId,
    previousValue: { status: report.status },
    newValue: { status: "REVIEWED" },
  });

  return updated;
}

/** @deprecated Use reviewEod — kept for route compatibility */
export const lockEod = reviewEod;

export async function escalateEod(
  user: { id: string; role: Role },
  reportId: string,
  reason: string,
) {
  if (!hasPermission(user.role, Permission.EOD_LOCK)) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
  if (!report) throw new EodError("Not found", "NOT_FOUND");

  if (report.status === "REVIEWED") {
    throw new EodError("Reviewed reports cannot be escalated", "NOT_ESCALATABLE");
  }

  const updated = await prisma.eodReport.update({
    where: { id: reportId },
    data: {
      status: "ESCALATED",
      escalatedAt: new Date(),
      escalationReason: reason.trim().slice(0, 500),
    },
    include: reportInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "EOD_ESCALATE",
    module: AuditModule.EOD,
    entityType: "EodReport",
    entityId: report.id,
    branchId: report.branchId,
    metadata: { reason },
  });

  return updated;
}

export function canEditEod(status: EodStatus, role: Role): boolean {
  if (!isEditableStatus(status)) return false;
  return hasPermission(role, Permission.EOD_DRAFT);
}

export function canSubmitEod(status: EodStatus, role: Role): boolean {
  if (!canSubmitStatus(status)) return false;
  return hasPermission(role, Permission.EOD_SUBMIT);
}

export function canLockEod(status: EodStatus, role: Role): boolean {
  if (!canReviewStatus(status)) return false;
  return hasPermission(role, Permission.EOD_LOCK);
}
