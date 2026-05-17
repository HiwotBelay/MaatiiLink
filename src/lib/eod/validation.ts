import { z } from "zod";
import { CASH_BANDS, type CashBand } from "./constants";

const cashBandEnum = CASH_BANDS.map((b) => b.value) as [CashBand, ...CashBand[]];

export const eodFormSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openingCashBand: z.enum(cashBandEnum),
  closingCashBand: z.enum(cashBandEnum),
  anomalyNotes: z.string().max(2000).optional().nullable(),
  complaintCount: z.number().int().min(0).max(9999),
  staffingNotes: z.string().max(2000).optional().nullable(),
});

export type EodFormInput = z.infer<typeof eodFormSchema>;
