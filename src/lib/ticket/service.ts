import type { Role, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import { TICKET_STATUS_TRANSITIONS } from "./constants";
import type { TicketCreateInput, TicketUpdateInput } from "./validation";

export class TicketError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const ticketInclude = {
  branch: { select: { name: true, branchCode: true } },
  creator: { select: { name: true, email: true } },
  assignee: { select: { name: true, email: true } },
} as const;

function resolveBranchId(user: { role: Role; branchId: string | null }) {
  if (!user.branchId) {
    throw new TicketError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

export async function countOpenTicketsForBranch(branchId: string) {
  return prisma.serviceTicket.count({
    where: {
      branchId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });
}

export async function listTickets(user: { role: Role; branchId: string | null }) {
  const canViewAll = hasPermission(user.role, Permission.TICKET_VIEW_ALL);
  const branchId = canViewAll ? undefined : resolveBranchId(user);

  return prisma.serviceTicket.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { createdAt: "desc" },
    include: ticketInclude,
  });
}

export async function createTicket(
  user: { id: string; role: Role; branchId: string | null },
  input: TicketCreateInput,
) {
  if (!hasPermission(user.role, Permission.TICKET_CREATE)) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  const branchId = resolveBranchId(user);

  const ticket = await prisma.serviceTicket.create({
    data: {
      branchId,
      creatorId: user.id,
      category: input.category as "IT" | "FACILITIES" | "CASH_LOGISTICS" | "OTHER",
      priority: input.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      title: input.title.trim(),
      description: input.description.trim(),
    },
    include: ticketInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "TICKET_CREATE",
    entityType: "ServiceTicket",
    entityId: ticket.id,
    metadata: { branchId, category: ticket.category, priority: ticket.priority },
  });

  return ticket;
}

export async function updateTicket(
  user: { id: string; role: Role; branchId: string | null },
  id: string,
  input: TicketUpdateInput,
) {
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id },
    include: ticketInclude,
  });
  if (!ticket) throw new TicketError("Not found", "NOT_FOUND");

  const canViewAll = hasPermission(user.role, Permission.TICKET_VIEW_ALL);
  if (!canViewAll && ticket.branchId !== user.branchId) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  if (input.assigneeId !== undefined) {
    if (!hasPermission(user.role, Permission.TICKET_ASSIGN)) {
      throw new TicketError("Forbidden", "FORBIDDEN");
    }
    const assignee = input.assigneeId
      ? await prisma.user.findUnique({ where: { id: input.assigneeId } })
      : null;
    if (input.assigneeId && (!assignee || !assignee.isActive)) {
      throw new TicketError("Invalid assignee", "VALIDATION");
    }
  }

  let nextStatus = ticket.status;
  if (input.status) {
    const allowed = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new TicketError(
        `Cannot transition from ${ticket.status} to ${input.status}`,
        "INVALID_TRANSITION",
      );
    }
    nextStatus = input.status as TicketStatus;
  }

  const resolvedAt =
    nextStatus === "RESOLVED" || nextStatus === "CLOSED"
      ? new Date()
      : ticket.resolvedAt;

  const updated = await prisma.serviceTicket.update({
    where: { id },
    data: {
      status: nextStatus,
      assigneeId: input.assigneeId !== undefined ? input.assigneeId : undefined,
      resolvedAt,
    },
    include: ticketInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: "TICKET_STATUS_CHANGE",
    entityType: "ServiceTicket",
    entityId: ticket.id,
    metadata: {
      from: ticket.status,
      to: nextStatus,
      assigneeId: updated.assigneeId,
    },
  });

  return updated;
}

export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["HO_ADMIN", "SUPERVISOR"] },
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
