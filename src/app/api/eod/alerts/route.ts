import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { getEodAlertsForScope } from "@/lib/eod/analytics";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.EOD_VIEW_BRANCH);
  if (error || !user) return error!;

  const branchId = request.nextUrl.searchParams.get("branchId") ?? undefined;
  const alerts = await getEodAlertsForScope(user, { branchId });
  return jsonOk({ ok: true, alerts });
}
