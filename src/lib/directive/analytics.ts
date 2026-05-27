import { prisma } from "@/lib/prisma";
import { hasPermission, Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export async function getDirectiveAnalytics(user: {
  id: string;
  role: Role;
  branchId: string | null;
}) {
  const canPublish = hasPermission(user.role, Permission.DIRECTIVE_PUBLISH);
  const now = new Date();

  const [directives, branchCount, userReads] = await Promise.all([
    prisma.directive.findMany({
      select: {
        id: true,
        isMandatory: true,
        deadlineAt: true,
        acknowledgments: canPublish
          ? { select: { branchId: true, acknowledgedAt: true } }
          : user.branchId
            ? { where: { branchId: user.branchId }, select: { branchId: true, acknowledgedAt: true } }
            : { select: { branchId: true, acknowledgedAt: true } },
      },
    }),
    canPublish ? prisma.branch.count() : Promise.resolve(1),
    prisma.directiveRead.findMany({
      where: { userId: user.id },
      select: { directiveId: true },
    }),
  ]);

  const readSet = new Set(userReads.map((r) => r.directiveId));
  const mandatory = directives.filter((d) => d.isMandatory);

  let unreadMandatory = 0;
  let overdueAcks = 0;
  let ackPairs = 0;
  let ackedPairs = 0;

  for (const d of mandatory) {
    if (!readSet.has(d.id)) unreadMandatory += 1;

    if (canPublish && branchCount > 0) {
      const ackedBranches = new Set(d.acknowledgments.map((a) => a.branchId));
      ackPairs += branchCount;
      ackedPairs += ackedBranches.size;
      if (d.deadlineAt && d.deadlineAt < now && ackedBranches.size < branchCount) {
        overdueAcks += branchCount - ackedBranches.size;
      }
    } else if (user.branchId) {
      const acked = d.acknowledgments.some((a) => a.branchId === user.branchId);
      ackPairs += 1;
      if (acked) ackedPairs += 1;
      if (d.deadlineAt && d.deadlineAt < now && !acked) overdueAcks += 1;
    }
  }

  const unreadAll = directives.filter((d) => !readSet.has(d.id)).length;
  const acknowledgmentRatePercent =
    ackPairs === 0 ? 100 : Math.round((ackedPairs / ackPairs) * 100);

  const byCategory = await prisma.directive.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  return {
    unreadMandatory,
    unreadAll,
    acknowledgmentRatePercent,
    overdueAcknowledgments: overdueAcks,
    mandatoryCount: mandatory.length,
    totalPublished: directives.length,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count.id,
    })),
  };
}
