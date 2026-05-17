import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { updateTicket, TicketError } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";
import { ticketUpdateSchema } from "@/lib/ticket/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.TICKET_ASSIGN);
  if (error || !user) return error!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = ticketUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const ticket = await updateTicket(user, id, parsed.data);
    return jsonOk({ ok: true, ticket: serializeTicket(ticket) });
  } catch (e) {
    if (e instanceof TicketError) {
      const status =
        e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
