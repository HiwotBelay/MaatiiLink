import type { Directive, DirectiveAcknowledgment, User } from "@prisma/client";

type DirectiveWithPublisher = Directive & {
  publishedBy?: Pick<User, "name"> | null;
  acknowledgments?: DirectiveAcknowledgment[];
};

export function serializeDirective(
  directive: DirectiveWithPublisher,
  options?: { branchId?: string | null },
) {
  const ack = options?.branchId
    ? directive.acknowledgments?.find((a) => a.branchId === options.branchId)
    : undefined;

  return {
    id: directive.id,
    title: directive.title,
    body: directive.body,
    isCritical: directive.isCritical,
    publishedBy: directive.publishedBy,
    publishedAt: directive.publishedAt.toISOString(),
    deadlineAt: directive.deadlineAt?.toISOString() ?? null,
    createdAt: directive.createdAt.toISOString(),
    acknowledged: Boolean(ack),
    acknowledgedAt: ack?.acknowledgedAt.toISOString() ?? null,
    quizPassed: ack?.quizPassed ?? null,
    isOverdue: Boolean(
      directive.deadlineAt &&
        !ack &&
        directive.deadlineAt.getTime() < Date.now(),
    ),
  };
}
