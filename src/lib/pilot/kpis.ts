import { prisma } from "@/lib/prisma";
import { parseReportDate, getAddisDateString } from "@/lib/eod/constants";
import { PILOT_KPI_TARGETS } from "./constants";
import type { PilotKpiResult } from "./types";

export type { PilotKpiResult } from "./types";

function addDays(dateStr: string, delta: number): string {
  const d = parseReportDate(dateStr);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function computePilotKpis(periodDays = 14): Promise<PilotKpiResult> {
  const pilotBranches = await prisma.branch.findMany({
    where: { isPilotBranch: true },
    select: { id: true },
  });
  const pilotIds = pilotBranches.map((b) => b.id);

  if (pilotIds.length === 0) {
    return emptyKpis(periodDays);
  }

  const today = getAddisDateString();
  const sinceStr = addDays(today, -(periodDays - 1));
  const since = parseReportDate(sinceStr);

  const eodReports = await prisma.eodReport.findMany({
    where: {
      branchId: { in: pilotIds },
      reportDate: { gte: since },
    },
    select: { status: true, submittedAt: true },
  });

  const eodOnTime = eodReports.filter((r) =>
    ["SUBMITTED", "REVIEWED", "LATE"].includes(r.status),
  ).length;
  const eodOnTimePercent =
    eodReports.length === 0 ? 0 : Math.round((eodOnTime / eodReports.length) * 100);

  const directives = await prisma.directive.findMany({
    where: { publishedAt: { gte: since } },
    select: {
      id: true,
      publishedAt: true,
      deadlineAt: true,
      acknowledgments: {
        where: { branchId: { in: pilotIds } },
        select: { acknowledgedAt: true, branchId: true },
      },
    },
  });

  let directivePairs = 0;
  let directiveAckedInTime = 0;
  for (const d of directives) {
    const deadlineMs =
      d.deadlineAt?.getTime() ??
      d.publishedAt.getTime() + 72 * 60 * 60 * 1000;
    for (const branchId of pilotIds) {
      directivePairs += 1;
      const ack = d.acknowledgments.find((a) => a.branchId === branchId);
      if (ack && ack.acknowledgedAt.getTime() <= deadlineMs) {
        directiveAckedInTime += 1;
      }
    }
  }
  const directiveAckWithin72hPercent =
    directivePairs === 0
      ? 100
      : Math.round((directiveAckedInTime / directivePairs) * 100);

  const incidents = await prisma.incident.findMany({
    where: {
      branchId: { in: pilotIds },
      createdAt: { gte: since },
      status: { not: "OPEN" },
    },
    select: { createdAt: true, updatedAt: true, severity: true, status: true },
  });

  const responseHours = incidents.map(
    (i) => (i.updatedAt.getTime() - i.createdAt.getTime()) / (60 * 60 * 1000),
  );
  responseHours.sort((a, b) => a - b);
  const incidentMedianResponseHours =
    responseHours.length === 0
      ? null
      : Math.round(
          responseHours[Math.floor(responseHours.length / 2)] * 10,
        ) / 10;

  const openSev1 = await prisma.pilotFeedback.findMany({
    where: {
      severity: "SEV1",
      status: { in: ["OPEN", "TRIAGED"] },
    },
    select: { createdAt: true },
  });

  const now = Date.now();
  const openSev1Over24h = openSev1.filter(
    (f) => now - f.createdAt.getTime() > 24 * 60 * 60 * 1000,
  ).length;

  const openSev1Incidents = await prisma.incident.count({
    where: {
      branchId: { in: pilotIds },
      severity: "CRITICAL",
      status: { in: ["OPEN", "ESCALATED"] },
      createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) },
    },
  });

  const sev1Over24 = openSev1Over24h + openSev1Incidents;

  return {
    pilotBranchCount: pilotIds.length,
    periodDays,
    eodOnTimePercent,
    eodTargetMet: eodOnTimePercent >= PILOT_KPI_TARGETS.eodOnTimePercent,
    directiveAckWithin72hPercent,
    directiveTargetMet:
      directiveAckWithin72hPercent >= PILOT_KPI_TARGETS.directiveAckWithin72hPercent,
    incidentMedianResponseHours,
    incidentTargetMet:
      incidentMedianResponseHours === null ||
      incidentMedianResponseHours < PILOT_KPI_TARGETS.incidentMedianResponseHours,
    openSev1Count: openSev1.length,
    openSev1Over24h: sev1Over24,
    sev1TargetMet: sev1Over24 === 0,
    targets: PILOT_KPI_TARGETS,
  };
}

function emptyKpis(periodDays: number): PilotKpiResult {
  return {
    pilotBranchCount: 0,
    periodDays,
    eodOnTimePercent: 0,
    eodTargetMet: false,
    directiveAckWithin72hPercent: 0,
    directiveTargetMet: false,
    incidentMedianResponseHours: null,
    incidentTargetMet: false,
    openSev1Count: 0,
    openSev1Over24h: 0,
    sev1TargetMet: true,
    targets: PILOT_KPI_TARGETS,
  };
}
