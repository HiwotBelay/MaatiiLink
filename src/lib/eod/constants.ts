/** Cash position bands (ETB) — no exact vault amounts in v1 */
export const CASH_BANDS = [
  { value: "0-50K", label: "0 - 50,000 ETB" },
  { value: "50K-200K", label: "50,000 - 200,000 ETB" },
  { value: "200K-500K", label: "200,000 - 500,000 ETB" },
  { value: "500K+", label: "500,000+ ETB" },
] as const;

export type CashBand = (typeof CASH_BANDS)[number]["value"];

export const CASH_BAND_VALUES = CASH_BANDS.map((b) => b.value);

export const LIQUIDITY_OPTIONS = [
  { value: "ADEQUATE", label: "Adequate" },
  { value: "WATCH", label: "Watch — monitor closely" },
  { value: "CRITICAL", label: "Critical — escalate" },
] as const;

/** Default EOD submission deadline (18:00 Addis Ababa) */
export const EOD_CUTOFF_HOUR = 18;

export function getAddisDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(
    date,
  );
}

export function parseReportDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isPastEodCutoff(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Addis_Ababa",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return hour >= EOD_CUTOFF_HOUR;
}
