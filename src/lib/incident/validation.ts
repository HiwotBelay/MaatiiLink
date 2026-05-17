import { z } from "zod";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from "./constants";

export const incidentCreateSchema = z.object({
  category: z.enum(INCIDENT_CATEGORIES as unknown as [string, ...string[]]),
  severity: z.enum(INCIDENT_SEVERITIES as unknown as [string, ...string[]]),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

export const incidentUpdateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES as unknown as [string, ...string[]]),
});

export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;
export type IncidentUpdateInput = z.infer<typeof incidentUpdateSchema>;
