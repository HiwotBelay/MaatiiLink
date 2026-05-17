import { z } from "zod";

export const directivePublishSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(20).max(20000),
  isCritical: z.boolean().optional().default(false),
  deadlineAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/)
    .optional()
    .nullable(),
});

export const directiveAckSchema = z.object({
  confirmRead: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the branch has read and will comply" }),
  }),
  quizPassed: z.boolean().optional(),
});

export type DirectivePublishInput = z.infer<typeof directivePublishSchema>;
export type DirectiveAckInput = z.infer<typeof directiveAckSchema>;
