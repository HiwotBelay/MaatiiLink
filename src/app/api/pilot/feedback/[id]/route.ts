import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  feedbackUpdateSchema,
  updatePilotFeedbackStatus,
} from "@/lib/pilot/feedback";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(
    request,
    Permission.PILOT_FEEDBACK_TRIAGE,
  );
  if (error || !user) return error!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = feedbackUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const item = await updatePilotFeedbackStatus(user, id, parsed.data.status);
    return jsonOk({
      ok: true,
      feedback: { id: item.id, status: item.status },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
