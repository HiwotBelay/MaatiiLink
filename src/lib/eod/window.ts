import { prisma } from "@/lib/prisma";
import { EOD_CUTOFF_HOUR, parseReportDate } from "./constants";

export type ReportingWindow = {
  cutoffHour: number;
  cutoffMinute: number;
  graceMinutes: number;
  timezone: string;
};

const DEFAULT_WINDOW: ReportingWindow = {
  cutoffHour: EOD_CUTOFF_HOUR,
  cutoffMinute: 0,
  graceMinutes: 30,
  timezone: "Africa/Addis_Ababa",
};

export async function resolveReportingWindow(
  branchId: string,
): Promise<ReportingWindow> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { region: true },
  });

  const branchWindow = await prisma.eodReportingWindow.findFirst({
    where: { branchId, isActive: true },
  });
  if (branchWindow) {
    return {
      cutoffHour: branchWindow.cutoffHour,
      cutoffMinute: branchWindow.cutoffMinute,
      graceMinutes: branchWindow.graceMinutes,
      timezone: branchWindow.timezone,
    };
  }

  if (branch?.region) {
    const regionWindow = await prisma.eodReportingWindow.findFirst({
      where: { region: branch.region, branchId: null, isActive: true },
    });
    if (regionWindow) {
      return {
        cutoffHour: regionWindow.cutoffHour,
        cutoffMinute: regionWindow.cutoffMinute,
        graceMinutes: regionWindow.graceMinutes,
        timezone: regionWindow.timezone,
      };
    }
  }

  return DEFAULT_WINDOW;
}

/** Deadline = report date + cutoff + grace in branch timezone. */
export function computeDueAt(
  reportDateStr: string,
  window: ReportingWindow,
): Date {
  const reportDate = parseReportDate(reportDateStr);
  const y = reportDate.getUTCFullYear();
  const m = reportDate.getUTCMonth() + 1;
  const d = reportDate.getUTCDate();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: window.timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+3";
  const offsetMatch = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  let offsetMinutes = 3 * 60;
  if (offsetMatch) {
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const hours = Number(offsetMatch[2]);
    const mins = Number(offsetMatch[3] ?? 0);
    offsetMinutes = sign * (hours * 60 + mins);
  }

  const cutoffTotalMinutes =
    window.cutoffHour * 60 + window.cutoffMinute + window.graceMinutes;

  const utcMs =
    Date.UTC(y, m - 1, d, 0, 0, 0) -
    offsetMinutes * 60 * 1000 +
    cutoffTotalMinutes * 60 * 1000;

  return new Date(utcMs);
}

export function isPastDue(dueAt: Date, now = new Date()): boolean {
  return now.getTime() > dueAt.getTime();
}

export function minutesUntilDue(dueAt: Date, now = new Date()): number {
  return Math.round((dueAt.getTime() - now.getTime()) / 60000);
}
