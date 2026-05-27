import type { DirectiveCategory, DirectivePriority, Prisma } from "@prisma/client";
import { RECENT_DAYS } from "./constants";

export type DirectiveSearchFilters = {
  q?: string;
  category?: DirectiveCategory;
  priority?: DirectivePriority;
  critical?: boolean;
  recent?: boolean;
  pinned?: boolean;
  mandatory?: boolean;
  sop?: boolean;
  unread?: boolean;
  userId?: string;
  branchId?: string | null;
};

function keywordTokens(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export function buildDirectiveWhere(
  filters: DirectiveSearchFilters,
): Prisma.DirectiveWhereInput {
  const and: Prisma.DirectiveWhereInput[] = [];

  if (filters.category) and.push({ category: filters.category });
  if (filters.priority) and.push({ priority: filters.priority });
  if (filters.critical) {
    and.push({
      OR: [{ priority: "CRITICAL" }, { isCritical: true }],
    });
  }
  if (filters.pinned) and.push({ isPinned: true });
  if (filters.mandatory) and.push({ isMandatory: true });
  if (filters.sop) and.push({ isSop: true });

  if (filters.recent) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - RECENT_DAYS);
    and.push({ publishedAt: { gte: since } });
  }

  if (filters.q) {
    const tokens = keywordTokens(filters.q);
    if (tokens.length > 0) {
      and.push({
        OR: tokens.flatMap((token) => [
          { title: { contains: token, mode: "insensitive" as const } },
          { summary: { contains: token, mode: "insensitive" as const } },
          { body: { contains: token, mode: "insensitive" as const } },
          { keywords: { has: token } },
        ]),
      });
    } else {
      and.push({
        OR: [
          { title: { contains: filters.q, mode: "insensitive" } },
          { summary: { contains: filters.q, mode: "insensitive" } },
          { body: { contains: filters.q, mode: "insensitive" } },
        ],
      });
    }
  }

  if (filters.unread && filters.userId) {
    and.push({
      reads: { none: { userId: filters.userId } },
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

export function directiveOrderBy(
  filters: Pick<DirectiveSearchFilters, "q" | "pinned" | "critical">,
): Prisma.DirectiveOrderByWithRelationInput[] {
  if (filters.pinned || filters.critical) {
    return [
      { isPinned: "desc" },
      { priority: "desc" },
      { publishedAt: "desc" },
    ];
  }
  return [{ isPinned: "desc" }, { publishedAt: "desc" }];
}
