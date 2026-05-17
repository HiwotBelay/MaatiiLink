import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getDirectiveById, DirectiveError } from "@/lib/directive/service";
import { serializeDirective } from "@/lib/directive/serialize";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.DIRECTIVE_VIEW);
  if (error || !user) return error!;

  const { id } = await params;

  try {
    const directive = await getDirectiveById(user, id);
    if (!directive) return jsonError("Not found", 404);
    return jsonOk({
      ok: true,
      directive: serializeDirective(directive, { branchId: user.branchId }),
    });
  } catch (e) {
    if (e instanceof DirectiveError) return jsonError(e.message, 403);
    throw e;
  }
}
