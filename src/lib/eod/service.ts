import type { EodStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { getAddisDateString, parseReportDate } from "./constants";
import type { EodFormInput } from "./validation";

export class EodError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

function resolveBranchId(user: { role: Role; branchId: string | null }, branchIdParam?: string | null) {
  if (user.role === "HO_ADMIN" && branchIdParam) return branchIdParam;
  if (!user.branchId) {
    throw new EodError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

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
    include: {
      branch: { select: { name: true, branchCode: true } },
      submittedBy: { select: { name: true } },
    },
  });
}

export async function getEodById(
  user: { role: Role; branchId: string | null },
  id: string,
) {
  const report = await prisma.eodReport.findUnique({
    where: { id },
    include: {
      branch: { select: { name: true, branchCode: true } },
      submittedBy: { select: { name: true } },
    },
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
    include: {
      branch: { select: { name: true, branchCode: true } },
      submittedBy: { select: { name: true } },
    },
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

  const existing = await prisma.eodReport.findUnique({
    where: { branchId_reportDate: { branchId, reportDate } },
  });

  if (existing && existing.status !== "DRAFT") {
    throw new EodError("Report is no longer editable", "NOT_EDITABLE");
  }

  const data = {
    openingCashBand: input.openingCashBand,
    closingCashBand: input.closingCashBand,
    anomalyNotes: input.anomalyNotes?.trim() || null,
    complaintCount: input.complaintCount,
    staffingNotes: input.staffingNotes?.trim() || null,
    status: "DRAFT" as EodStatus,
  };

  if (existing) {
    const updated = await prisma.eodReport.update({
      where: { id: existing.id },
      data,
      include: {
        branch: { select: { name: true, branchCode: true } },
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "EOD_DRAFT_SAVE",
      entityType: "EodReport",
      entityId: updated.id,
      metadata: { branchId, reportDate: reportDate.toISOString() },
    });
    return updated;
  }

  const created = await prisma.eodReport.create({
    data: {
      branchId,
      reportDate,
      ...data,
    },
    include: {
      branch: { select: { name: true, branchCode: true } },
    },
  });
  await writeAuditLog({
    userId: user.id,
    action: "EOD_DRAFT_SAVE",
    entityType: "EodReport",
    entityId: created.id,
    metadata: { branchId, reportDate: reportDate.toISOString() },
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

  if (user.role !== "HO_ADMIN" && report.branchId !== user.branchId) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  if (report.status !== "DRAFT") {
    throw new EodError("Only draft reports can be submitted", "NOT_DRAFT");
  }

  if (!report.openingCashBand || !report.closingCashBand) {
    throw new EodError("Cash bands are required before submit", "VALIDATION");
  }

  const updated = await prisma.eodReport.update({
    where: { id: reportId },
    data: {
      status: "SUBMITTED",
      submittedById: user.id,
      submittedAt: new Date(),
    },
    include: {
      branch: { select: { name: true, branchCode: true } },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "EOD_SUBMIT",
    entityType: "EodReport",
    entityId: report.id,
    metadata: {
      branchId: report.branchId,
      reportDate: report.reportDate.toISOString(),
    },
  });

  return updated;
}

export async function lockEod(
  user: { id: string; role: Role },
  reportId: string,
) {
  if (!hasPermission(user.role, Permission.EOD_LOCK)) {
    throw new EodError("Forbidden", "FORBIDDEN");
  }

  const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
  if (!report) throw new EodError("Not found", "NOT_FOUND");

  if (report.status !== "SUBMITTED") {
    throw new EodError("Only submitted reports can be locked", "NOT_SUBMITTED");
  }

  const updated = await prisma.eodReport.update({
    where: { id: reportId },
    data: { status: "LOCKED" },
  });

  await writeAuditLog({
    userId: user.id,
    action: "EOD_LOCK",
    entityType: "EodReport",
    entityId: report.id,
  });

  return updated;
}

export function canEditEod(status: EodStatus, role: Role): boolean {
  if (status !== "DRAFT") return false;
  return hasPermission(role, Permission.EOD_DRAFT);
}

export function canSubmitEod(status: EodStatus, role: Role): boolean {
  if (status !== "DRAFT") return false;
  return hasPermission(role, Permission.EOD_SUBMIT);
}

export function canLockEod(status: EodStatus, role: Role): boolean {
  if (status !== "SUBMITTED") return false;
  return hasPermission(role, Permission.EOD_LOCK);
}
