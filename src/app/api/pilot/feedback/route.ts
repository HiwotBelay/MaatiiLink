import { NextRequest } from "next/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonForbidden, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  createPilotFeedback,
  feedbackCreateSchema,
  listPilotFeedback,
} from "@/lib/pilot/feedback";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.PILOT_VIEW);
  if (error || !user) return error!;

  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const items = await listPilotFeedback({ status: status ?? undefined });

  return jsonOk({
    ok: true,
    feedback: items.map((f) => ({
      id: f.id,
      category: f.category,
      severity: f.severity,
      status: f.status,
      description: f.description,
      branch: f.branch,
      user: f.user,
      createdAt: f.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;

  if (!hasPermission(user.role, Permission.PILOT_FEEDBACK_CREATE)) {
    return jsonForbidden();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = feedbackCreateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  const item = await createPilotFeedback(user, parsed.data);
  return jsonOk(
    {
      ok: true,
      feedback: {
        id: item.id,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      },
    },
    201,
  );
}
