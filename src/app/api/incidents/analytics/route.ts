import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { getIncidentAnalytics } from "@/lib/incident/analytics";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_VIEW_BRANCH,
  );
  if (error || !user) return error!;

  const days = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const analytics = await getIncidentAnalytics(user, days);
  return jsonOk({ ok: true, analytics });
}
