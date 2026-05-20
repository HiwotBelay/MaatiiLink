import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { addTicketNote, TicketError } from "@/lib/ticket/service";
import { ticketNoteSchema } from "@/lib/ticket/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.TICKET_ASSIGN);
  if (error || !user) return error!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = ticketNoteSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const note = await addTicketNote(user, id, parsed.data);
    return jsonOk({
      ok: true,
      note: {
        id: note.id,
        body: note.body,
        isInternal: note.isInternal,
        authorName: note.author.name,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (e) {
    if (e instanceof TicketError) {
      const status =
        e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
