import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  listDirectives,
  publishDirective,
  DirectiveError,
} from "@/lib/directive/service";
import { serializeDirective } from "@/lib/directive/serialize";
import { directivePublishSchema } from "@/lib/directive/validation";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.DIRECTIVE_VIEW);
  if (error || !user) return error!;

  try {
    const directives = await listDirectives(user);
    return jsonOk({
      ok: true,
      directives: directives.map((d) =>
        serializeDirective(d, { branchId: user.branchId }),
      ),
    });
  } catch (e) {
    if (e instanceof DirectiveError) return jsonError(e.message, 403);
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.DIRECTIVE_PUBLISH,
  );
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = directivePublishSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const directive = await publishDirective(user, parsed.data);
    return jsonOk(
      {
        ok: true,
        directive: serializeDirective(directive, { branchId: user.branchId }),
      },
      201,
    );
  } catch (e) {
    if (e instanceof DirectiveError) return jsonError(e.message, 403);
    throw e;
  }
}
