import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { listLoginActivityForUser } from "@/lib/security/login-activity";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;

  const activities = await listLoginActivityForUser(user.id, 30);

  return jsonOk({
    ok: true,
    activities: activities.map((a) => ({
      id: a.id,
      success: a.success,
      failureReason: a.failureReason,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
