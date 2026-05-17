import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { z } from "zod";
import {
  PILOT_FEEDBACK_CATEGORIES,
  PILOT_FEEDBACK_SEVERITIES,
  PILOT_FEEDBACK_STATUSES,
} from "./constants";

export const feedbackCreateSchema = z.object({
  category: z.enum(PILOT_FEEDBACK_CATEGORIES as unknown as [string, ...string[]]),
  severity: z.enum(PILOT_FEEDBACK_SEVERITIES as unknown as [string, ...string[]]),
  description: z.string().min(10).max(3000),
});

export const feedbackUpdateSchema = z.object({
  status: z.enum(PILOT_FEEDBACK_STATUSES as unknown as [string, ...string[]]),
});

export async function listPilotFeedback(options?: { status?: string }) {
  return prisma.pilotFeedback.findMany({
    where: options?.status ? { status: options.status as "OPEN" } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      branch: { select: { name: true, branchCode: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function createPilotFeedback(
  user: { id: string; branchId: string | null },
  input: z.infer<typeof feedbackCreateSchema>,
) {
  const item = await prisma.pilotFeedback.create({
    data: {
      branchId: user.branchId,
      userId: user.id,
      category: input.category as "BUG",
      severity: input.severity as "MEDIUM",
      description: input.description.trim(),
    },
    include: {
      branch: { select: { name: true, branchCode: true } },
      user: { select: { name: true, email: true } },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "PILOT_FEEDBACK_CREATE",
    entityType: "PilotFeedback",
    entityId: item.id,
    metadata: { category: item.category, severity: item.severity },
  });

  return item;
}

export async function updatePilotFeedbackStatus(
  user: { id: string; role: Role },
  id: string,
  status: string,
) {
  if (!hasPermission(user.role, Permission.PILOT_FEEDBACK_TRIAGE)) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.pilotFeedback.update({
    where: { id },
    data: { status: status as "TRIAGED" },
    include: {
      branch: { select: { name: true, branchCode: true } },
      user: { select: { name: true, email: true } },
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "PILOT_FEEDBACK_STATUS",
    entityType: "PilotFeedback",
    entityId: id,
    metadata: { status },
  });

  return updated;
}
