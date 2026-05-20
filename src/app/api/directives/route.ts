import { NextRequest } from "next/server";
import type { DirectiveCategory, DirectivePriority } from "@prisma/client";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  publishDirective,
  searchDirectives,
  DirectiveError,
} from "@/lib/directive/service";
import { serializeDirective } from "@/lib/directive/serialize";
import {
  directivePublishSchema,
  directiveSearchSchema,
} from "@/lib/directive/validation";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.DIRECTIVE_VIEW,
  );
  if (error || !user) return error!;

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = directiveSearchSchema.safeParse(raw);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const directives = await searchDirectives(user, {
      q: parsed.data.q,
      category: parsed.data.category as DirectiveCategory | undefined,
      priority: parsed.data.priority as DirectivePriority | undefined,
      critical: parsed.data.critical,
      recent: parsed.data.recent,
      pinned: parsed.data.pinned,
      mandatory: parsed.data.mandatory,
      sop: parsed.data.sop,
      unread: parsed.data.unread,
    });
    return jsonOk({
      ok: true,
      directives: directives.map((d) =>
        serializeDirective(d, {
          branchId: user.branchId,
          userId: user.id,
        }),
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
        directive: serializeDirective(directive, {
          branchId: user.branchId,
          userId: user.id,
        }),
      },
      201,
    );
  } catch (e) {
    if (e instanceof DirectiveError) return jsonError(e.message, 403);
    throw e;
  }
}
