import { z } from "zod";
import {
  TICKET_DEPARTMENTS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "./constants";

export const ticketCreateSchema = z.object({
  category: z.enum(TICKET_DEPARTMENTS as unknown as [string, ...string[]]),
  priority: z.enum(TICKET_PRIORITIES as unknown as [string, ...string[]]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  tags: z.array(z.string().min(1).max(40)).max(12).optional().default([]),
});

export const ticketSearchSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.enum(TICKET_DEPARTMENTS as unknown as [string, ...string[]]).optional(),
  priority: z.enum(TICKET_PRIORITIES as unknown as [string, ...string[]]).optional(),
  status: z.enum(TICKET_STATUSES as unknown as [string, ...string[]]).optional(),
  unassigned: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  slaBreached: z.coerce.boolean().optional(),
  branchId: z.string().cuid().optional(),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(TICKET_STATUSES as unknown as [string, ...string[]]).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  escalate: z.boolean().optional(),
});

export const ticketNoteSchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(true),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketSearchInput = z.infer<typeof ticketSearchSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type TicketNoteInput = z.infer<typeof ticketNoteSchema>;
