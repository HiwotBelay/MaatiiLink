import { z } from "zod";
import { CASH_BANDS, type CashBand } from "./constants";

const cashBandEnum = CASH_BANDS.map((b) => b.value) as [CashBand, ...CashBand[]];
const optionalCashBand = z.enum(cashBandEnum).optional().nullable();
const liquidityEnum = z.enum(["ADEQUATE", "WATCH", "CRITICAL"]).optional().nullable();

export const eodFormSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openingCashBand: optionalCashBand,
  closingCashBand: optionalCashBand,
  cashInflowBand: optionalCashBand,
  cashOutflowBand: optionalCashBand,
  liquidityStatus: liquidityEnum,
  complaintCount: z.number().int().min(0).max(9999).default(0),
  staffingIssues: z.string().max(4000).optional().nullable(),
  atmDowntimeMinutes: z.number().int().min(0).max(1440).default(0),
  systemDowntimeMinutes: z.number().int().min(0).max(1440).default(0),
  operationalBlockers: z.string().max(4000).optional().nullable(),
  securityConcerns: z.string().max(4000).optional().nullable(),
  highValueTransactionNotes: z.string().max(4000).optional().nullable(),
  performanceNotes: z.string().max(4000).optional().nullable(),
  anomalyNotes: z.string().max(4000).optional().nullable(),
});

export type EodFormInput = z.infer<typeof eodFormSchema>;
