import type { EodReport, LiquidityStatus } from "@prisma/client";
import { CASH_BAND_VALUES } from "./constants";

export type EodAlertSeverity = "info" | "warning" | "critical";

export type EodAlert = {
  id: string;
  type:
    | "ABNORMAL_CASH"
    | "REPEATED_DOWNTIME"
    | "OVERDUE_REPORTING"
    | "HIGH_INCIDENTS";
  severity: EodAlertSeverity;
  title: string;
  message: string;
  branchId?: string;
  reportId?: string;
};

const BAND_INDEX: Record<string, number> = Object.fromEntries(
  CASH_BAND_VALUES.map((v, i) => [v, i]),
);

function bandIndex(band: string | null | undefined): number | null {
  if (!band) return null;
  return BAND_INDEX[band] ?? null;
}

export function detectReportAlerts(
  report: Pick<
    EodReport,
    | "id"
    | "branchId"
    | "status"
    | "dueAt"
    | "cashInflowBand"
    | "cashOutflowBand"
    | "openingCashBand"
    | "closingCashBand"
    | "atmDowntimeMinutes"
    | "systemDowntimeMinutes"
    | "liquidityStatus"
  >,
  context?: { openIncidentCount?: number },
): EodAlert[] {
  const alerts: EodAlert[] = [];

  const inIdx =
    bandIndex(report.cashInflowBand) ?? bandIndex(report.openingCashBand);
  const outIdx =
    bandIndex(report.cashOutflowBand) ?? bandIndex(report.closingCashBand);
  if (inIdx !== null && outIdx !== null && Math.abs(inIdx - outIdx) >= 2) {
    alerts.push({
      id: `${report.id}-cash`,
      type: "ABNORMAL_CASH",
      severity: "warning",
      title: "Abnormal cash movement",
      message: "Inflow and outflow bands differ significantly from opening position.",
      branchId: report.branchId,
      reportId: report.id,
    });
  }

  if (report.liquidityStatus === "CRITICAL") {
    alerts.push({
      id: `${report.id}-liq`,
      type: "ABNORMAL_CASH",
      severity: "critical",
      title: "Critical liquidity",
      message: "Liquidity status flagged as critical — escalate to regional ops.",
      branchId: report.branchId,
      reportId: report.id,
    });
  }

  const downtime = report.atmDowntimeMinutes + report.systemDowntimeMinutes;
  if (downtime >= 90) {
    alerts.push({
      id: `${report.id}-down`,
      type: "REPEATED_DOWNTIME",
      severity: downtime >= 180 ? "critical" : "warning",
      title: "Extended downtime",
      message: `ATM/system downtime totals ${downtime} minutes today.`,
      branchId: report.branchId,
      reportId: report.id,
    });
  }

  if (
    report.status === "PENDING" &&
    report.dueAt &&
    report.dueAt.getTime() < Date.now()
  ) {
    alerts.push({
      id: `${report.id}-overdue`,
      type: "OVERDUE_REPORTING",
      severity: "critical",
      title: "Overdue operations report",
      message: "Reporting window closed — submit immediately or escalate.",
      branchId: report.branchId,
      reportId: report.id,
    });
  }

  const incidents = context?.openIncidentCount ?? 0;
  if (incidents >= 3) {
    alerts.push({
      id: `${report.id}-inc`,
      type: "HIGH_INCIDENTS",
      severity: incidents >= 5 ? "critical" : "warning",
      title: "High incident frequency",
      message: `${incidents} open incidents at this branch today.`,
      branchId: report.branchId,
      reportId: report.id,
    });
  }

  return alerts;
}

export function detectDowntimeTrend(
  recentReports: Pick<EodReport, "id" | "atmDowntimeMinutes" | "systemDowntimeMinutes">[],
  branchId: string,
): EodAlert | null {
  const last3 = recentReports.slice(0, 3);
  if (last3.length < 3) return null;
  const allHigh = last3.every(
    (r) => r.atmDowntimeMinutes + r.systemDowntimeMinutes >= 60,
  );
  if (!allHigh) return null;
  return {
    id: `${branchId}-downtime-trend`,
    type: "REPEATED_DOWNTIME",
    severity: "warning",
    title: "Repeated downtime pattern",
    message: "Three consecutive days with elevated ATM/system downtime.",
    branchId,
  };
}
