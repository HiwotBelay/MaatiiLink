import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { notifyDirectivePublished } from "@/lib/notifications/email";
import type { DirectiveAckInput, DirectivePublishInput } from "./validation";

export class DirectiveError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const directiveInclude = {
  publishedBy: { select: { name: true } },
  acknowledgments: true,
} as const;

export async function listDirectives(user: {
  role: Role;
  branchId: string | null;
}) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_VIEW)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  return prisma.directive.findMany({
    orderBy: { publishedAt: "desc" },
    include: directiveInclude,
  });
}

export async function getDirectiveById(
  user: { role: Role; branchId: string | null },
  id: string,
) {
  const directive = await prisma.directive.findUnique({
    where: { id },
    include: directiveInclude,
  });
  if (!directive) return null;

  if (!hasPermission(user.role, Permission.DIRECTIVE_VIEW)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }
  return directive;
}

export async function publishDirective(
  user: { id: string; role: Role; name: string },
  input: DirectivePublishInput,
) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_PUBLISH)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  const deadlineAt = input.deadlineAt
    ? new Date(`${input.deadlineAt.slice(0, 10)}T23:59:59.000Z`)
    : null;

  const directive = await prisma.directive.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      isCritical: input.isCritical ?? false,
      deadlineAt,
      publishedById: user.id,
    },
    include: directiveInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "DIRECTIVE_PUBLISH",
    entityType: "Directive",
    entityId: directive.id,
    metadata: { isCritical: directive.isCritical },
  });

  void notifyDirectivePublished({
    directiveId: directive.id,
    title: directive.title,
    isCritical: directive.isCritical,
    deadlineAt: directive.deadlineAt,
    publisherName: user.name,
  });

  return directive;
}

export async function acknowledgeDirective(
  user: { id: string; role: Role; branchId: string | null },
  directiveId: string,
  input: DirectiveAckInput,
) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_ACK)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  if (!user.branchId) {
    throw new DirectiveError("User is not assigned to a branch", "NO_BRANCH");
  }

  const directive = await prisma.directive.findUnique({
    where: { id: directiveId },
  });
  if (!directive) throw new DirectiveError("Not found", "NOT_FOUND");

  const existing = await prisma.directiveAcknowledgment.findUnique({
    where: {
      directiveId_branchId: {
        directiveId,
        branchId: user.branchId,
      },
    },
  });
  if (existing) {
    throw new DirectiveError("Already acknowledged for this branch", "ALREADY_ACKED");
  }

  const ack = await prisma.directiveAcknowledgment.create({
    data: {
      directiveId,
      branchId: user.branchId,
      userId: user.id,
      quizPassed: input.quizPassed ?? null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "DIRECTIVE_ACK",
    entityType: "Directive",
    entityId: directiveId,
    metadata: { branchId: user.branchId, ackId: ack.id },
  });

  return ack;
}

export async function countOverdueAcksForBranch(branchId: string) {
  const now = new Date();
  const directives = await prisma.directive.findMany({
    where: {
      deadlineAt: { lt: now },
    },
    select: {
      id: true,
      acknowledgments: {
        where: { branchId },
        select: { id: true },
      },
    },
  });

  return directives.filter((d) => d.acknowledgments.length === 0).length;
}
