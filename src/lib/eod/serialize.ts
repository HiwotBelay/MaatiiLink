import type { EodReport, Branch, User } from "@prisma/client";

type EodWithRelations = EodReport & {
  branch?: Pick<Branch, "name" | "branchCode" | "region"> | null;
  submittedBy?: Pick<User, "name"> | null;
  reviewedBy?: Pick<User, "name"> | null;
};

export function serializeEod(report: EodWithRelations) {
  return {
    id: report.id,
    branchId: report.branchId,
    branch: report.branch,
    reportDate: report.reportDate.toISOString().slice(0, 10),
    status: report.status,
    dueAt: report.dueAt?.toISOString() ?? null,
    draftSavedAt: report.draftSavedAt?.toISOString() ?? null,
    openingCashBand: report.openingCashBand,
    closingCashBand: report.closingCashBand,
    cashInflowBand: report.cashInflowBand,
    cashOutflowBand: report.cashOutflowBand,
    liquidityStatus: report.liquidityStatus,
    complaintCount: report.complaintCount,
    staffingIssues: report.staffingIssues,
    atmDowntimeMinutes: report.atmDowntimeMinutes,
    systemDowntimeMinutes: report.systemDowntimeMinutes,
    operationalBlockers: report.operationalBlockers,
    securityConcerns: report.securityConcerns,
    highValueTransactionNotes: report.highValueTransactionNotes,
    performanceNotes: report.performanceNotes,
    anomalyNotes: report.anomalyNotes,
    complianceScore: report.complianceScore,
    submittedBy: report.submittedBy,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    reviewedBy: report.reviewedBy,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    escalatedAt: report.escalatedAt?.toISOString() ?? null,
    escalationReason: report.escalationReason,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
