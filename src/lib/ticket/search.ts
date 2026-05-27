import type { TicketCategory, TicketPriority, TicketStatus, Prisma } from "@prisma/client";
import { ACTIVE_STATUSES } from "./constants";

export type TicketSearchFilters = {
  q?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigneeId?: string | null;
  unassigned?: boolean;
  overdue?: boolean;
  slaBreached?: boolean;
  branchId?: string;
  tags?: string[];
};

export function buildTicketWhere(
  filters: TicketSearchFilters,
  baseBranchId?: string,
): Prisma.ServiceTicketWhereInput {
  const and: Prisma.ServiceTicketWhereInput[] = [];

  if (baseBranchId) and.push({ branchId: baseBranchId });
  if (filters.branchId) and.push({ branchId: filters.branchId });
  if (filters.category) and.push({ category: filters.category });
  if (filters.priority) and.push({ priority: filters.priority });
  if (filters.status) and.push({ status: filters.status });
  if (filters.assigneeId) and.push({ assigneeId: filters.assigneeId });
  if (filters.unassigned) {
    and.push({ assigneeId: null, status: { in: [...ACTIVE_STATUSES] } });
  }
  if (filters.overdue) {
    and.push({
      status: { in: [...ACTIVE_STATUSES] },
      slaResolutionDueAt: { lt: new Date() },
    });
  }
  if (filters.slaBreached) {
    and.push({ slaBreachedAt: { not: null } });
  }
  if (filters.tags?.length) {
    and.push({ tags: { hasSome: filters.tags } });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { ticketRef: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

export function ticketOrderBy(): Prisma.ServiceTicketOrderByWithRelationInput[] {
  return [
    { priority: "desc" },
    { slaResolutionDueAt: "asc" },
    { createdAt: "desc" },
  ];
}
