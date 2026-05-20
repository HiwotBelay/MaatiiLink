import { z } from "zod";
import { DIRECTIVE_CATEGORIES, DIRECTIVE_PRIORITIES } from "./constants";

export const directivePublishSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().max(500).optional().nullable(),
  body: z.string().min(20).max(50000),
  category: z.enum(DIRECTIVE_CATEGORIES as unknown as [string, ...string[]]),
  priority: z.enum(DIRECTIVE_PRIORITIES as unknown as [string, ...string[]]),
  keywords: z.array(z.string().min(1).max(40)).max(20).optional().default([]),
  isCritical: z.boolean().optional().default(false),
  isPinned: z.boolean().optional().default(false),
  isMandatory: z.boolean().optional().default(false),
  isSop: z.boolean().optional().default(false),
  deadlineAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/)
    .optional()
    .nullable(),
});

export const directiveSearchSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.enum(DIRECTIVE_CATEGORIES as unknown as [string, ...string[]]).optional(),
  priority: z.enum(DIRECTIVE_PRIORITIES as unknown as [string, ...string[]]).optional(),
  critical: z.coerce.boolean().optional(),
  recent: z.coerce.boolean().optional(),
  pinned: z.coerce.boolean().optional(),
  mandatory: z.coerce.boolean().optional(),
  sop: z.coerce.boolean().optional(),
  unread: z.coerce.boolean().optional(),
});

export const directiveAckSchema = z.object({
  confirmRead: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the branch has read and will comply" }),
  }),
  quizPassed: z.boolean().optional(),
});

export type DirectivePublishInput = z.infer<typeof directivePublishSchema>;
export type DirectiveSearchInput = z.infer<typeof directiveSearchSchema>;
export type DirectiveAckInput = z.infer<typeof directiveAckSchema>;
