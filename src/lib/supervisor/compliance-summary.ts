import { prisma } from "@/lib/prisma";
import { getBranchEodSummaryForToday } from "@/lib/eod/branch-summary";

export async function getBranchComplianceSummary() {
  const eodRows = await getBranchEodSummaryForToday();
  const branchIds = eodRows.map((r) => r.branchId);

  const [openIncidents, criticalIncidents, overdueByBranch] = await Promise.all([
    prisma.incident.groupBy({
      by: ["branchId"],
      where: {
        branchId: { in: branchIds },
        status: { in: ["OPEN", "ESCALATED"] },
      },
      _count: { id: true },
    }),
    prisma.incident.findMany({
      where: {
        severity: "CRITICAL",
        status: { in: ["OPEN", "ESCALATED"] },
      },
      select: { id: true, title: true, branchId: true },
    }),
    getOverdueDirectiveCountsByBranch(branchIds),
  ]);

  const openMap = new Map(
    openIncidents.map((g) => [g.branchId, g._count.id]),
  );

  return {
    rows: eodRows.map((r) => ({
      ...r,
      openIncidents: openMap.get(r.branchId) ?? 0,
      overdueDirectives: overdueByBranch.get(r.branchId) ?? 0,
    })),
    criticalIncidents,
    totalCriticalOpen: criticalIncidents.length,
    totalOverdueAcks: [...overdueByBranch.values()].reduce((a, b) => a + b, 0),
  };
}

async function getOverdueDirectiveCountsByBranch(branchIds: string[]) {
  const now = new Date();
  const directives = await prisma.directive.findMany({
    where: { deadlineAt: { lt: now } },
    select: {
      id: true,
      acknowledgments: { select: { branchId: true } },
    },
  });

  const counts = new Map<string, number>();
  for (const branchId of branchIds) counts.set(branchId, 0);

  for (const d of directives) {
    const acked = new Set(d.acknowledgments.map((a) => a.branchId));
    for (const branchId of branchIds) {
      if (!acked.has(branchId)) {
        counts.set(branchId, (counts.get(branchId) ?? 0) + 1);
      }
    }
  }

  return counts;
}
