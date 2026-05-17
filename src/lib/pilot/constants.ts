/** Roadmap Phase 5 pilot KPI targets */
export const PILOT_KPI_TARGETS = {
  eodOnTimePercent: 90,
  directiveAckWithin72hPercent: 95,
  incidentMedianResponseHours: 4,
  sev1MaxOpenHours: 24,
} as const;

export const PILOT_FEEDBACK_CATEGORIES = [
  "BUG",
  "UX",
  "TRAINING",
  "FEATURE",
  "OTHER",
] as const;

export const PILOT_FEEDBACK_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "SEV1"] as const;

export const PILOT_FEEDBACK_STATUSES = ["OPEN", "TRIAGED", "FIXED", "WONTFIX"] as const;
