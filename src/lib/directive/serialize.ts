import type {
  Directive,
  DirectiveAcknowledgment,
  DirectiveRead,
  User,
} from "@prisma/client";

type DirectiveWithRelations = Directive & {
  publishedBy?: Pick<User, "name"> | null;
  acknowledgments?: DirectiveAcknowledgment[];
  reads?: DirectiveRead[];
};

export function serializeDirective(
  directive: DirectiveWithRelations,
  options?: { branchId?: string | null; userId?: string },
) {
  const ack = options?.branchId
    ? directive.acknowledgments?.find((a) => a.branchId === options.branchId)
    : undefined;

  const userRead = options?.userId
    ? directive.reads?.find((r) => r.userId === options.userId)
    : undefined;

  return {
    id: directive.id,
    title: directive.title,
    summary: directive.summary,
    body: directive.body,
    category: directive.category,
    priority: directive.priority,
    keywords: directive.keywords,
    isCritical: directive.isCritical,
    isPinned: directive.isPinned,
    isMandatory: directive.isMandatory,
    isSop: directive.isSop,
    publishedBy: directive.publishedBy,
    publishedAt: directive.publishedAt.toISOString(),
    updatedAt: directive.updatedAt.toISOString(),
    deadlineAt: directive.deadlineAt?.toISOString() ?? null,
    createdAt: directive.createdAt.toISOString(),
    acknowledged: Boolean(ack),
    acknowledgedAt: ack?.acknowledgedAt.toISOString() ?? null,
    quizPassed: ack?.quizPassed ?? null,
    readByUser: Boolean(userRead),
    readAt: userRead?.readAt.toISOString() ?? null,
    isOverdue: Boolean(
      directive.isMandatory &&
        directive.deadlineAt &&
        !ack &&
        directive.deadlineAt.getTime() < Date.now(),
    ),
  };
}

export type SerializedDirective = ReturnType<typeof serializeDirective>;
