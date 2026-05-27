import { prisma } from "@/lib/prisma";
import { getBranchComplianceSummary } from "@/lib/supervisor/compliance-summary";

/** National KPIs and live work queues for Head Office (real DB — not mock). */
export async function getHoDashboardSummary() {
  const compliance = await getBranchComplianceSummary();

  const missingEod = compliance.rows.filter((r) =>
    ["MISSING", "LATE", "ESCALATED"].includes(r.eodStatus),
  ).length;

  const [
    openTickets,
    unassignedTickets,
    publishedProcedures,
    unassignedTicketRows,
    criticalIncidentRows,
    lateEodBranches,
  ] = await Promise.all([
    prisma.serviceTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.serviceTicket.count({
      where: { status: "OPEN", assigneeId: null },
    }),
    prisma.directive.count(),
    prisma.serviceTicket.findMany({
      where: { status: "OPEN", assigneeId: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        branch: { select: { name: true, branchCode: true } },
      },
    }),
    prisma.incident.findMany({
      where: {
        severity: "CRITICAL",
        status: { in: ["OPEN", "ASSIGNED", "INVESTIGATING", "ESCALATED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        branch: { select: { name: true, branchCode: true } },
      },
    }),
    Promise.resolve(
      compliance.rows
        .filter((r) => ["MISSING", "LATE", "ESCALATED"].includes(r.eodStatus))
        .slice(0, 8),
    ),
  ]);

  return {
    branchCount: compliance.rows.length,
    missingEod,
    criticalIncidents: compliance.totalCriticalOpen,
    overdueDirectiveAcks: compliance.totalOverdueAcks,
    openTickets,
    unassignedTickets,
    publishedProcedures,
    unassignedTicketRows,
    criticalIncidentRows,
    lateEodBranches,
  };
}
