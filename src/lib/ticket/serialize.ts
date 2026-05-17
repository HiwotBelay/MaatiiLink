import type { Branch, ServiceTicket, User } from "@prisma/client";
import { isSlaBreached, slaHoursRemaining, slaTargetHours } from "./sla";

type TicketWithRelations = ServiceTicket & {
  branch?: Pick<Branch, "name" | "branchCode"> | null;
  creator?: Pick<User, "name" | "email"> | null;
  assignee?: Pick<User, "name" | "email"> | null;
};

export function serializeTicket(ticket: TicketWithRelations) {
  const slaHours = slaTargetHours(ticket.priority);
  const hoursLeft = slaHoursRemaining(ticket.createdAt, ticket.priority);
  return {
    id: ticket.id,
    branchId: ticket.branchId,
    branch: ticket.branch,
    creatorId: ticket.creatorId,
    creator: ticket.creator,
    assigneeId: ticket.assigneeId,
    assignee: ticket.assignee,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    title: ticket.title,
    description: ticket.description,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    slaTargetHours: slaHours,
    slaHoursRemaining: hoursLeft,
    slaBreached: isSlaBreached(ticket.createdAt, ticket.priority, ticket.status),
  };
}
