import { NextRequest } from "next/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonForbidden, jsonOk, jsonValidation } from "@/lib/api/http";
import { createTicket, listTickets, TicketError } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";
import { ticketCreateSchema } from "@/lib/ticket/validation";

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

  try {
    const tickets = await listTickets(user);
    return jsonOk({ ok: true, tickets: tickets.map(serializeTicket) });
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
