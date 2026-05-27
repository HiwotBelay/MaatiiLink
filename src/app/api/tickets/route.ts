import { NextRequest } from "next/server";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { hasPermission, Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonForbidden, jsonOk, jsonValidation } from "@/lib/api/http";
import { createTicket, searchTickets, TicketError } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";
import { ticketCreateSchema, ticketSearchSchema } from "@/lib/ticket/validation";

function canViewTickets(role: Parameters<typeof hasPermission>[0]) {
  return (
    hasPermission(role, Permission.TICKET_VIEW_BRANCH) ||
    hasPermission(role, Permission.TICKET_VIEW_ALL)
  );
}

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;
  if (!canViewTickets(user.role)) return jsonForbidden();

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = ticketSearchSchema.safeParse(raw);
  if (!parsed.success) return jsonValidation(parsed.error);

  const includeNotes = hasPermission(user.role, Permission.TICKET_ASSIGN);

  try {
    const tickets = await searchTickets(user, {
      q: parsed.data.q,
      category: parsed.data.category as TicketCategory | undefined,
      priority: parsed.data.priority as TicketPriority | undefined,
      status: parsed.data.status as TicketStatus | undefined,
      unassigned: parsed.data.unassigned,
      overdue: parsed.data.overdue,
      slaBreached: parsed.data.slaBreached,
      branchId: parsed.data.branchId,
    });
    return jsonOk({
      ok: true,
      tickets: tickets.map((t) =>
        serializeTicket(t, { includeInternalNotes: includeNotes }),
      ),
    });
  } catch (e) {
    if (e instanceof TicketError) {
      return jsonError(e.message, e.code === "FORBIDDEN" ? 403 : 400);
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.TICKET_CREATE);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = ticketCreateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const ticket = await createTicket(user, parsed.data);
    return jsonOk({ ok: true, ticket: serializeTicket(ticket) }, 201);
  } catch (e) {
    if (e instanceof TicketError) {
      return jsonError(e.message, e.code === "FORBIDDEN" ? 403 : 400);
    }
    throw e;
  }
}
