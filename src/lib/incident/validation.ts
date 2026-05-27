import { z } from "zod";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
} from "./constants";

const categoryEnum = z.enum(INCIDENT_CATEGORIES as unknown as [string, ...string[]]);
const severityEnum = z.enum(INCIDENT_SEVERITIES as unknown as [string, ...string[]]);
const statusEnum = z.enum(INCIDENT_STATUSES as unknown as [string, ...string[]]);

export const incidentCreateSchema = z.object({
  category: categoryEnum,
  severity: severityEnum,
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

export const incidentUpdateSchema = z.object({
  status: statusEnum,
  assigneeId: z.string().cuid().optional().nullable(),
});

export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;
export type IncidentUpdateInput = z.infer<typeof incidentUpdateSchema>;
