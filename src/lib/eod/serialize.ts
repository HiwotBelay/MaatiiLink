import type { EodReport, Branch, User } from "@prisma/client";

type EodWithRelations = EodReport & {
  branch?: Pick<Branch, "name" | "branchCode"> | null;
  submittedBy?: Pick<User, "name"> | null;
};

export function serializeEod(report: EodWithRelations) {
  return {
    id: report.id,
    branchId: report.branchId,
    branch: report.branch,
    reportDate: report.reportDate.toISOString().slice(0, 10),
    status: report.status,
    openingCashBand: report.openingCashBand,
    closingCashBand: report.closingCashBand,
    anomalyNotes: report.anomalyNotes,
    complaintCount: report.complaintCount,
    staffingNotes: report.staffingNotes,
    submittedBy: report.submittedBy,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
