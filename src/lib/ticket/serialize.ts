import type {
  Branch,
  ServiceTicket,
  TicketNote,
  User,
} from "@prisma/client";
import {
  isResponseSlaBreached,
  isSlaBreached,
  slaHoursRemaining,
  slaTargetHours,
} from "./sla";
import { DEPARTMENT_LABELS, STATUS_LABELS } from "./constants";
import type { TicketCategory, TicketStatus } from "@prisma/client";

type NoteWithAuthor = TicketNote & {
  author?: Pick<User, "name"> | null;
};

type TicketWithRelations = ServiceTicket & {
  branch?: Pick<Branch, "name" | "branchCode" | "region"> | null;
  creator?: Pick<User, "name" | "email"> | null;
  assignee?: Pick<User, "name" | "email"> | null;
  escalatedTo?: Pick<User, "name" | "email"> | null;
  notes?: NoteWithAuthor[];
};

export function serializeTicket(
  ticket: TicketWithRelations,
  options?: { includeInternalNotes?: boolean },
) {
  const hoursLeft = slaHoursRemaining(
    ticket.slaResolutionDueAt,
    ticket.status,
  );
  const breached = isSlaBreached(
    ticket.slaResolutionDueAt,
    ticket.status,
    ticket.slaBreachedAt,
  );
  const responseBreached = isResponseSlaBreached(
    ticket.slaResponseDueAt,
    ticket.firstResponseAt,
    ticket.status,
  );

  const notes =
    options?.includeInternalNotes && ticket.notes
      ? ticket.notes.map((n) => ({
          id: n.id,
          body: n.body,
          isInternal: n.isInternal,
          authorName: n.author?.name ?? "Unknown",
          createdAt: n.createdAt.toISOString(),
        }))
      : undefined;

  return {
    id: ticket.id,
    ticketRef: ticket.ticketRef,
    branchId: ticket.branchId,
    branch: ticket.branch,
    creatorId: ticket.creatorId,
    creator: ticket.creator,
    assigneeId: ticket.assigneeId,
    assignee: ticket.assignee,
    escalatedToId: ticket.escalatedToId,
    escalatedTo: ticket.escalatedTo,
    category: ticket.category,
    departmentLabel: DEPARTMENT_LABELS[ticket.category as TicketCategory],
    priority: ticket.priority,
    status: ticket.status,
    statusLabel: STATUS_LABELS[ticket.status as TicketStatus],
    tags: ticket.tags,
    title: ticket.title,
    description: ticket.description,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    escalatedAt: ticket.escalatedAt?.toISOString() ?? null,
    firstResponseAt: ticket.firstResponseAt?.toISOString() ?? null,
    slaResponseDueAt: ticket.slaResponseDueAt?.toISOString() ?? null,
    slaResolutionDueAt: ticket.slaResolutionDueAt?.toISOString() ?? null,
    slaBreachedAt: ticket.slaBreachedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    slaTargetHours: slaTargetHours(ticket.priority),
    slaHoursRemaining: hoursLeft,
    slaBreached: breached,
    responseSlaBreached: responseBreached,
    notes,
    noteCount: ticket.notes?.length ?? 0,
  };
}

export type SerializedTicket = ReturnType<typeof serializeTicket>;
