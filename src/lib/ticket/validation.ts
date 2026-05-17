import { z } from "zod";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "./constants";

export const ticketCreateSchema = z.object({
  category: z.enum(TICKET_CATEGORIES as unknown as [string, ...string[]]),
  priority: z.enum(TICKET_PRIORITIES as unknown as [string, ...string[]]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(TICKET_STATUSES as unknown as [string, ...string[]]).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
