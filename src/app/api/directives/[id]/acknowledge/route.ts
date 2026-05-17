import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  acknowledgeDirective,
  DirectiveError,
} from "@/lib/directive/service";
import { directiveAckSchema } from "@/lib/directive/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.DIRECTIVE_ACK);
  if (error || !user) return error!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = directiveAckSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    await acknowledgeDirective(user, id, parsed.data);
    return jsonOk({ ok: true, acknowledged: true });
  } catch (e) {
    if (e instanceof DirectiveError) {
      const statusCode =
        e.code === "NOT_FOUND"
          ? 404
          : e.code === "ALREADY_ACKED"
            ? 409
            : e.code === "FORBIDDEN"
              ? 403
              : 400;
      return jsonError(e.message, statusCode);
    }
    throw e;
  }
}
