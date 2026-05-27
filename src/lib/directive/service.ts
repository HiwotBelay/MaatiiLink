import type { DirectiveCategory, DirectivePriority, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { notifyDirectivePublished } from "@/lib/notifications/email";
import {
  buildDirectiveWhere,
  directiveOrderBy,
  type DirectiveSearchFilters,
} from "./search";
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
  reads: true,
} as const;

type DirectiveUser = {
  id: string;
  role: Role;
  branchId: string | null;
  name?: string;
};

export async function searchDirectives(
  user: DirectiveUser,
  filters: DirectiveSearchFilters = {},
) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_VIEW)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  const where = buildDirectiveWhere({
    ...filters,
    userId: filters.unread ? user.id : undefined,
  });

  return prisma.directive.findMany({
    where,
    orderBy: directiveOrderBy(filters),
    include: directiveInclude,
  });
}

export async function listDirectives(user: DirectiveUser) {
  return searchDirectives(user, {});
}

export async function getDirectiveById(user: DirectiveUser, id: string) {
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

export async function markDirectiveRead(user: DirectiveUser, directiveId: string) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_VIEW)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  const directive = await prisma.directive.findUnique({
    where: { id: directiveId },
    select: { id: true },
  });
  if (!directive) throw new DirectiveError("Not found", "NOT_FOUND");

  await prisma.directiveRead.upsert({
    where: {
      directiveId_userId: { directiveId, userId: user.id },
    },
    create: { directiveId, userId: user.id },
    update: { readAt: new Date() },
  });

  return { ok: true };
}

export async function publishDirective(
  user: DirectiveUser & { name: string },
  input: DirectivePublishInput,
) {
  if (!hasPermission(user.role, Permission.DIRECTIVE_PUBLISH)) {
    throw new DirectiveError("Forbidden", "FORBIDDEN");
  }

  const deadlineAt = input.deadlineAt
    ? new Date(`${input.deadlineAt.slice(0, 10)}T23:59:59.000Z`)
    : null;

  const isCritical =
    input.isCritical || input.priority === "CRITICAL";

  const directive = await prisma.directive.create({
    data: {
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      body: input.body.trim(),
      category: input.category as DirectiveCategory,
      priority: input.priority as DirectivePriority,
      keywords: input.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
      isCritical,
      isPinned: input.isPinned ?? false,
      isMandatory: input.isMandatory ?? false,
      isSop: input.isSop ?? false,
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
    metadata: {
      isCritical: directive.isCritical,
      category: directive.category,
      isMandatory: directive.isMandatory,
    },
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
  user: DirectiveUser,
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

  await prisma.directiveRead.upsert({
    where: {
      directiveId_userId: { directiveId, userId: user.id },
    },
    create: { directiveId, userId: user.id },
    update: { readAt: new Date() },
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
      isMandatory: true,
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

export async function getPinnedAndLatest(user: DirectiveUser) {
  const [pinned, latest] = await Promise.all([
    searchDirectives(user, { pinned: true, critical: false }),
    prisma.directive.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
      include: directiveInclude,
    }),
  ]);
  return { pinned, latest };
}
