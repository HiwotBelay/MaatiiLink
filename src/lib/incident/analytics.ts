import { prisma } from "@/lib/prisma";
import { hasPermission, Permission } from "@/lib/rbac";
import { incidentVisibilityFilter, type IncidentViewer } from "./access";
import { averageResponseTimeMs, isSlaOverdue } from "./sla";
import { ACTIVE_STATUSES } from "./constants";

export async function getIncidentAnalytics(user: IncidentViewer, days = 30) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const visibility = incidentVisibilityFilter(user);
  const canViewAll = hasPermission(user.role, Permission.INCIDENT_VIEW_ALL);

  const incidents = await prisma.incident.findMany({
    where: {
      AND: [visibility, { createdAt: { gte: since } }],
    },
    include: {
      branch: { select: { id: true, name: true, branchCode: true, region: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byDay = new Map<string, { date: string; count: number; critical: number }>();
  for (const i of incidents) {
    const date = i.createdAt.toISOString().slice(0, 10);
    const point = byDay.get(date) ?? { date, count: 0, critical: 0 };
    point.count++;
    if (i.severity === "CRITICAL") point.critical++;
    byDay.set(date, point);
  }
  const trends = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  const categoryCount = new Map<string, number>();
  for (const i of incidents) {
    categoryCount.set(i.category, (categoryCount.get(i.category) ?? 0) + 1);
  }
  const recurringIssues = [...categoryCount.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const branchStats = new Map<
    string,
    { branchId: string; name: string; code: string; open: number; overdue: number; critical: number }
  >();

  for (const i of incidents) {
    const bid = i.branchId;
    const stat = branchStats.get(bid) ?? {
      branchId: bid,
      name: i.branch.name,
      code: i.branch.branchCode,
      open: 0,
      overdue: 0,
      critical: 0,
    };
    if (ACTIVE_STATUSES.includes(i.status)) stat.open++;
    if (isSlaOverdue(i.slaResolutionDueAt, i.status)) stat.overdue++;
    if (i.severity === "CRITICAL") stat.critical++;
    branchStats.set(bid, stat);
  }

  const branchRiskScore = [...branchStats.values()].map((b) => {
    let risk = b.open * 5 + b.overdue * 15 + b.critical * 25;
    risk = Math.min(100, risk);
    return { ...b, riskScore: risk };
  }).sort((a, b) => b.riskScore - a.riskScore);

  const avgResponseMs = averageResponseTimeMs(incidents);
  const avgResponseHours =
    avgResponseMs != null ? Math.round((avgResponseMs / 3600000) * 10) / 10 : null;

  const overdueCount = incidents.filter((i) =>
    isSlaOverdue(i.slaResolutionDueAt, i.status),
  ).length;

  return {
    trends,
    recurringIssues,
    branchRiskScore: canViewAll ? branchRiskScore.slice(0, 15) : branchRiskScore.slice(0, 5),
    avgResponseHours,
    totalIncidents: incidents.length,
    openIncidents: incidents.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
    overdueCount,
    criticalOpen: incidents.filter(
      (i) => i.severity === "CRITICAL" && ACTIVE_STATUSES.includes(i.status),
    ).length,
  };
}
