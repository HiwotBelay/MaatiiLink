import type { EodStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permission } from "@/lib/rbac";
import { getAddisDateString, parseReportDate } from "./constants";
import { computeComplianceScore } from "./status";
import { detectDowntimeTrend, detectReportAlerts, type EodAlert } from "./alerts";
import { resolveReportingWindow, computeDueAt } from "./window";

export type LateTrendPoint = {
  date: string;
  onTime: number;
  late: number;
  pending: number;
};

export type BranchComplianceRow = {
  branchId: string;
  branchCode: string;
  name: string;
  complianceScore: number;
  status: EodStatus | "MISSING";
  reportId: string | null;
};

export type RiskIndicator = {
  key: string;
  label: string;
  value: number;
  level: "low" | "medium" | "high";
};

export async function getEodAnalytics(
  user: { role: Role; branchId: string | null },
  options?: { branchId?: string; days?: number },
) {
  const days = options?.days ?? 14;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const canViewAll = hasPermission(user.role, Permission.EOD_VIEW_ALL);
  const branchFilter = canViewAll
    ? options?.branchId
      ? { branchId: options.branchId }
      : {}
    : user.branchId
      ? { branchId: user.branchId }
      : { branchId: "__none__" };

  const reports = await prisma.eodReport.findMany({
    where: { ...branchFilter, reportDate: { gte: since } },
    orderBy: { reportDate: "desc" },
    include: {
      branch: { select: { id: true, name: true, branchCode: true } },
    },
  });

  const byDate = new Map<string, LateTrendPoint>();
  for (const r of reports) {
    const date = r.reportDate.toISOString().slice(0, 10);
    const point = byDate.get(date) ?? {
      date,
      onTime: 0,
      late: 0,
      pending: 0,
    };
    if (r.status === "SUBMITTED" || r.status === "REVIEWED") point.onTime++;
    else if (r.status === "LATE" || r.status === "ESCALATED") point.late++;
    else if (r.status === "PENDING") point.pending++;
    byDate.set(date, point);
  }

  const lateTrend = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const today = parseReportDate(getAddisDateString());
  const branches = await prisma.branch.findMany({
    where: canViewAll
      ? options?.branchId
        ? { id: options.branchId }
        : {}
      : { id: user.branchId ?? "__none__" },
    select: { id: true, name: true, branchCode: true },
  });

  const todayReports = await prisma.eodReport.findMany({
    where: {
      reportDate: today,
      branchId: { in: branches.map((b) => b.id) },
    },
  });
  const todayMap = new Map(todayReports.map((r) => [r.branchId, r]));

  const branchCompliance: BranchComplianceRow[] = branches.map((b) => {
    const r = todayMap.get(b.id);
    if (!r) {
      return {
        branchId: b.id,
        branchCode: b.branchCode,
        name: b.name,
        complianceScore: 0,
        status: "MISSING" as const,
        reportId: null,
      };
    }
    return {
      branchId: b.id,
      branchCode: b.branchCode,
      name: b.name,
      complianceScore:
        r.complianceScore ??
        computeComplianceScore({
          status: r.status,
          submittedAt: r.submittedAt,
          dueAt: r.dueAt,
          complaintCount: r.complaintCount,
          atmDowntimeMinutes: r.atmDowntimeMinutes,
          systemDowntimeMinutes: r.systemDowntimeMinutes,
          liquidityStatus: r.liquidityStatus,
        }),
      status: r.status,
      reportId: r.id,
    };
  });

  const avgCompliance =
    branchCompliance.length > 0
      ? Math.round(
          branchCompliance.reduce((s, b) => s + b.complianceScore, 0) /
            branchCompliance.length,
        )
      : 0;

  const lateCount = reports.filter((r) => r.status === "LATE").length;
  const escalatedCount = reports.filter((r) => r.status === "ESCALATED").length;
  const pendingOverdue = reports.filter(
    (r) => r.status === "PENDING" && r.dueAt && r.dueAt < new Date(),
  ).length;

  const riskIndicators: RiskIndicator[] = [
    {
      key: "late_rate",
      label: "Late submission rate",
      value: reports.length
        ? Math.round((lateCount / reports.length) * 100)
        : 0,
      level:
        lateCount / Math.max(reports.length, 1) > 0.2
          ? "high"
          : lateCount > 0
            ? "medium"
            : "low",
    },
    {
      key: "escalations",
      label: "Escalated reports",
      value: escalatedCount,
      level: escalatedCount > 2 ? "high" : escalatedCount > 0 ? "medium" : "low",
    },
    {
      key: "overdue_pending",
      label: "Overdue (not submitted)",
      value: pendingOverdue,
      level:
        pendingOverdue > 3 ? "high" : pendingOverdue > 0 ? "medium" : "low",
    },
    {
      key: "avg_compliance",
      label: "Avg compliance score",
      value: avgCompliance,
      level: avgCompliance < 70 ? "high" : avgCompliance < 85 ? "medium" : "low",
    },
  ];

  return {
    lateTrend,
    branchCompliance,
    riskIndicators,
    avgCompliance,
  };
}

export async function getEodAlertsForScope(
  user: { role: Role; branchId: string | null },
  options?: { branchId?: string },
): Promise<EodAlert[]> {
  const canViewAll = hasPermission(user.role, Permission.EOD_VIEW_ALL);
  const branchId = canViewAll ? options?.branchId : user.branchId;
  if (!branchId && !canViewAll) return [];

  const today = parseReportDate(getAddisDateString());
  const where = branchId ? { branchId } : {};

  const [todayReports, recentByBranch, incidentGroups] = await Promise.all([
    prisma.eodReport.findMany({
      where: { ...where, reportDate: today },
    }),
    prisma.eodReport.findMany({
      where,
      orderBy: { reportDate: "desc" },
      take: branchId ? 10 : 50,
    }),
    prisma.incident.groupBy({
      by: ["branchId"],
      where: {
        ...(branchId ? { branchId } : {}),
        status: { in: ["OPEN", "ESCALATED"] },
        createdAt: { gte: today },
      },
      _count: { id: true },
    }),
  ]);

  const incidentMap = new Map(
    incidentGroups.map((g) => [g.branchId, g._count.id]),
  );

  const alerts: EodAlert[] = [];

  for (const r of todayReports) {
    alerts.push(
      ...detectReportAlerts(r, {
        openIncidentCount: incidentMap.get(r.branchId) ?? 0,
      }),
    );
  }

  const byBranch = new Map<string, typeof recentByBranch>();
  for (const r of recentByBranch) {
    const list = byBranch.get(r.branchId) ?? [];
    list.push(r);
    byBranch.set(r.branchId, list);
  }
  for (const [bid, list] of byBranch) {
    const trend = detectDowntimeTrend(list, bid);
    if (trend) alerts.push(trend);
  }

  if (!branchId && canViewAll) {
    const branches = await prisma.branch.findMany({ select: { id: true, region: true } });
    for (const b of branches) {
      const hasReport = todayReports.some((r) => r.branchId === b.id);
      if (!hasReport) {
        const win = await resolveReportingWindow(b.id);
        const dueAt = computeDueAt(getAddisDateString(), win);
        if (dueAt < new Date()) {
          alerts.push({
            id: `missing-${b.id}`,
            type: "OVERDUE_REPORTING",
            severity: "critical",
            title: "Missing operations report",
            message: "No EOD submitted for today after reporting window.",
            branchId: b.id,
          });
        }
      }
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
