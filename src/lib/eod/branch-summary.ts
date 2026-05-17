import { prisma } from "@/lib/prisma";
import { getAddisDateString, parseReportDate, isPastEodCutoff } from "./constants";

export async function getBranchEodSummaryForToday() {
  const today = parseReportDate(getAddisDateString());
  const pastCutoff = isPastEodCutoff();

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      branchCode: true,
      district: true,
      eodReports: {
        where: { reportDate: today },
        take: 1,
        select: { id: true, status: true, submittedAt: true },
      },
    },
  });

  return branches.map((b) => {
    const report = b.eodReports[0];
    let eodStatus: "MISSING" | "DRAFT" | "SUBMITTED" | "LOCKED" | "LATE" = "MISSING";
    if (report) {
      eodStatus = report.status;
    } else if (pastCutoff) {
      eodStatus = "LATE";
    }
    return {
      branchId: b.id,
      name: b.name,
      branchCode: b.branchCode,
      district: b.district,
      eodStatus,
      reportId: report?.id ?? null,
      submittedAt: report?.submittedAt?.toISOString() ?? null,
    };
  });
}
