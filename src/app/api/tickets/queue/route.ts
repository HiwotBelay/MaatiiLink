import { NextRequest } from "next/server";
import type { TicketCategory } from "@prisma/client";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getAssignmentQueue, TicketError } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.TICKET_ASSIGN);
  if (error || !user) return error!;

  const category = request.nextUrl.searchParams.get(
    "category",
  ) as TicketCategory | null;

  try {
    const tickets = await getAssignmentQueue(
      user,
      category ?? undefined,
    );
    return jsonOk({
      ok: true,
      queue: tickets.map((t) =>
        serializeTicket(t, { includeInternalNotes: true }),
      ),
    });
  } catch (e) {
    if (e instanceof TicketError) return jsonError(e.message, 403);
    throw e;
  }
}
