import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { markDirectiveRead, DirectiveError } from "@/lib/directive/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(
    request,
    Permission.DIRECTIVE_VIEW,
  );
  if (error || !user) return error!;

  const { id } = await params;

  try {
    await markDirectiveRead(user, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof DirectiveError) {
      const status = e.code === "NOT_FOUND" ? 404 : 403;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
