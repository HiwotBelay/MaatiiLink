import type { PILOT_KPI_TARGETS } from "./constants";

/** KPI snapshot for the pilot dashboard (client-safe; no Prisma imports). */
export type PilotKpiResult = {
  pilotBranchCount: number;
  periodDays: number;
  eodOnTimePercent: number;
  eodTargetMet: boolean;
  directiveAckWithin72hPercent: number;
  directiveTargetMet: boolean;
  incidentMedianResponseHours: number | null;
  incidentTargetMet: boolean;
  openSev1Count: number;
  openSev1Over24h: number;
  sev1TargetMet: boolean;
  targets: typeof PILOT_KPI_TARGETS;
};
