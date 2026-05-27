import { prisma } from "@/lib/prisma";
import { getAddisDateString, parseReportDate } from "./constants";
import { resolveReportingWindow, computeDueAt, isPastDue } from "./window";
import type { EodStatus } from "@prisma/client";

export type BranchEodDisplayStatus = EodStatus | "MISSING";

export async function getBranchEodSummaryForToday() {
  const todayStr = getAddisDateString();
  const today = parseReportDate(todayStr);

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      branchCode: true,
      district: true,
      region: true,
      eodReports: {
        where: { reportDate: today },
        take: 1,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          dueAt: true,
          complianceScore: true,
        },
      },
    },
  });

  const summaries = await Promise.all(
    branches.map(async (b) => {
      const report = b.eodReports[0];
      let eodStatus: BranchEodDisplayStatus = "MISSING";

      if (report) {
        eodStatus = report.status;
        if (report.status === "PENDING" && report.dueAt && isPastDue(report.dueAt)) {
          eodStatus = "LATE";
        }
      } else {
        const win = await resolveReportingWindow(b.id);
        const dueAt = computeDueAt(todayStr, win);
        if (isPastDue(dueAt)) eodStatus = "LATE";
      }

      return {
        branchId: b.id,
        name: b.name,
        branchCode: b.branchCode,
        district: b.district,
        region: b.region,
        eodStatus,
        reportId: report?.id ?? null,
        submittedAt: report?.submittedAt?.toISOString() ?? null,
        complianceScore: report?.complianceScore ?? null,
      };
    }),
  );

  return summaries;
}
