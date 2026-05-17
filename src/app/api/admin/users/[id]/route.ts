import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { patchAdminUser } from "@/lib/admin/provision";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.ADMIN_USERS);
  if (error || !user) return error!;

  const { id } = await params;
  if (id === user.id) {
    return jsonError("Cannot deactivate your own account", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const result = await patchAdminUser(user.id, id, body);
  if (!result.ok) {
    if (typeof result.error === "string") {
      return jsonError(result.error, 404);
    }
    return jsonValidation(result.error);
  }

  return jsonOk({ ok: true, user: result.user });
}
