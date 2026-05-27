import type {
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasPermission, Permission } from "@/lib/rbac";
import {
  TICKET_STATUS_TRANSITIONS,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  DEPARTMENT_ASSIGN_ROLES,
  ESCALATION_CHAIN,
} from "./constants";
import { suggestCategory, suggestTags } from "./categorize";
import {
  buildTicketWhere,
  ticketOrderBy,
  type TicketSearchFilters,
} from "./search";
import { computeSlaDeadlines } from "./sla";
import type {
  TicketCreateInput,
  TicketNoteInput,
  TicketUpdateInput,
} from "./validation";

export class TicketError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const ticketInclude = {
  branch: { select: { name: true, branchCode: true, region: true } },
  creator: { select: { name: true, email: true } },
  assignee: { select: { name: true, email: true } },
  escalatedTo: { select: { name: true, email: true } },
  notes: {
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

async function generateTicketRef(): Promise<string> {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
  }).format(new Date());
  const prefix = `TKT-${date.replace(/-/g, "")}`;
  const count = await prisma.serviceTicket.count({
    where: { ticketRef: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

function resolveBranchId(user: { role: Role; branchId: string | null }) {
  if (!user.branchId) {
    throw new TicketError("User is not assigned to a branch", "NO_BRANCH");
  }
  return user.branchId;
}

function visibilityBranchId(user: { role: Role; branchId: string | null }) {
  if (hasPermission(user.role, Permission.TICKET_VIEW_ALL)) return undefined;
  return user.branchId ?? "__none__";
}

async function processSlaBreaches(baseWhere: ReturnType<typeof buildTicketWhere>) {
  const now = new Date();
  const overdue = await prisma.serviceTicket.findMany({
    where: {
      AND: [
        baseWhere,
        { status: { in: [...ACTIVE_STATUSES] } },
        { slaResolutionDueAt: { lt: now } },
        { slaBreachedAt: null },
      ],
    },
    select: { id: true },
  });
  if (overdue.length === 0) return;
  await prisma.serviceTicket.updateMany({
    where: { id: { in: overdue.map((t) => t.id) } },
    data: { slaBreachedAt: now },
  });
}

async function findEscalationTarget(
  category: TicketCategory,
): Promise<string | null> {
  const roles = ESCALATION_CHAIN[category];
  const user = await prisma.user.findFirst({
    where: { isActive: true, role: { in: [...roles] } },
    orderBy: { name: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function countOpenTicketsForBranch(branchId: string) {
  return prisma.serviceTicket.count({
    where: {
      branchId,
      status: { in: [...ACTIVE_STATUSES] },
    },
  });
}

export async function searchTickets(
  user: { role: Role; branchId: string | null },
  filters: TicketSearchFilters = {},
) {
  if (
    !hasPermission(user.role, Permission.TICKET_VIEW_BRANCH) &&
    !hasPermission(user.role, Permission.TICKET_VIEW_ALL)
  ) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  const baseBranch = visibilityBranchId(user);
  const where = buildTicketWhere(filters, baseBranch);
  await processSlaBreaches(where);

  return prisma.serviceTicket.findMany({
    where,
    orderBy: ticketOrderBy(),
    include: ticketInclude,
  });
}

export async function listTickets(user: {
  role: Role;
  branchId: string | null;
}) {
  return searchTickets(user, {});
}

export async function getAssignmentQueue(
  user: { role: Role; branchId: string | null },
  category?: TicketCategory,
) {
  if (!hasPermission(user.role, Permission.TICKET_ASSIGN)) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  return searchTickets(user, {
    unassigned: true,
    category,
  });
}

export async function getTicketById(
  user: { role: Role; branchId: string | null },
  id: string,
) {
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id },
    include: ticketInclude,
  });
  if (!ticket) return null;

  const canViewAll = hasPermission(user.role, Permission.TICKET_VIEW_ALL);
  if (!canViewAll && ticket.branchId !== user.branchId) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }
  return ticket;
}

export async function createTicket(
  user: { id: string; role: Role; branchId: string | null },
  input: TicketCreateInput,
) {
  if (!hasPermission(user.role, Permission.TICKET_CREATE)) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  const branchId = resolveBranchId(user);
  const category =
    (input.category as TicketCategory) ||
    suggestCategory(input.title, input.description);
  const tags =
    input.tags.length > 0
      ? input.tags
      : suggestTags(input.title, input.description);
  const priority = input.priority as TicketPriority;
  const now = new Date();
  const sla = computeSlaDeadlines(now, priority);
  const ticketRef = await generateTicketRef();

  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketRef,
      branchId,
      creatorId: user.id,
      category,
      priority,
      tags: tags.map((t) => t.toLowerCase()),
      title: input.title.trim(),
      description: input.description.trim(),
      slaResponseDueAt: sla.responseDue,
      slaResolutionDueAt: sla.resolutionDue,
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

  if (
    input.assigneeId !== undefined ||
    input.status ||
    input.escalate
  ) {
    if (!hasPermission(user.role, Permission.TICKET_ASSIGN)) {
      throw new TicketError("Forbidden", "FORBIDDEN");
    }
  }

  let nextStatus = ticket.status;
  if (input.status) {
    const allowed = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(input.status as TicketStatus)) {
      throw new TicketError(
        `Cannot transition from ${ticket.status} to ${input.status}`,
        "INVALID_TRANSITION",
      );
    }
    nextStatus = input.status as TicketStatus;
  }

  let assigneeId = ticket.assigneeId;
  if (input.assigneeId !== undefined) {
    if (input.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assigneeId },
      });
      const roles = DEPARTMENT_ASSIGN_ROLES[ticket.category];
      if (
        !assignee ||
        !assignee.isActive ||
        !roles.includes(assignee.role)
      ) {
        throw new TicketError(
          "Assignee not valid for this department",
          "VALIDATION",
        );
      }
    }
    assigneeId = input.assigneeId;
    if (assigneeId && nextStatus === "OPEN") {
      nextStatus = "ASSIGNED";
    }
  }

  let escalatedToId = ticket.escalatedToId;
  let escalatedAt = ticket.escalatedAt;
  if (input.escalate) {
    nextStatus = "ESCALATED";
    escalatedAt = new Date();
    escalatedToId = await findEscalationTarget(ticket.category);
  }

  const now = new Date();
  const firstResponseAt =
    ticket.firstResponseAt ??
    (assigneeId || nextStatus !== "OPEN" ? now : null);

  const resolvedAt = TERMINAL_STATUSES.includes(nextStatus)
    ? ticket.resolvedAt ?? now
    : null;

  const updated = await prisma.serviceTicket.update({
    where: { id },
    data: {
      status: nextStatus,
      assigneeId,
      escalatedToId,
      escalatedAt,
      firstResponseAt,
      resolvedAt,
    },
    include: ticketInclude,
  });

  await writeAuditLog({
    userId: user.id,
    action: input.escalate ? "TICKET_ESCALATE" : "TICKET_STATUS_CHANGE",
    entityType: "ServiceTicket",
    entityId: ticket.id,
    metadata: {
      from: ticket.status,
      to: nextStatus,
      assigneeId: updated.assigneeId,
      escalatedToId: updated.escalatedToId,
    },
  });

  return updated;
}

export async function addTicketNote(
  user: { id: string; role: Role; branchId: string | null },
  ticketId: string,
  input: TicketNoteInput,
) {
  if (!hasPermission(user.role, Permission.TICKET_ASSIGN)) {
    throw new TicketError("Forbidden", "FORBIDDEN");
  }

  const ticket = await getTicketById(user, ticketId);
  if (!ticket) throw new TicketError("Not found", "NOT_FOUND");

  const note = await prisma.ticketNote.create({
    data: {
      ticketId,
      authorId: user.id,
      body: input.body.trim(),
      isInternal: input.isInternal ?? true,
    },
    include: { author: { select: { name: true } } },
  });

  if (!ticket.firstResponseAt) {
    await prisma.serviceTicket.update({
      where: { id: ticketId },
      data: { firstResponseAt: new Date() },
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "TICKET_NOTE",
    entityType: "ServiceTicket",
    entityId: ticketId,
    metadata: { noteId: note.id },
  });

  return note;
}

export async function listAssignableUsers(category?: TicketCategory) {
  const roles = category
    ? DEPARTMENT_ASSIGN_ROLES[category]
    : ([
        "IT_SUPPORT",
        "HO_OPERATIONS",
        "REGIONAL_SUPERVISOR",
        "SUPER_ADMIN",
      ] as const);

  return prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [...roles] },
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
