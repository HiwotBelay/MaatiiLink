import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { getEodAnalytics } from "@/lib/eod/analytics";
import { EodError } from "@/lib/eod/service";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.EOD_VIEW_BRANCH);
  if (error || !user) return error!;

  const { searchParams } = request.nextUrl;
  const branchId = searchParams.get("branchId") ?? undefined;
  const days = Number(searchParams.get("days") ?? 14);

  try {
    const analytics = await getEodAnalytics(user, { branchId, days });
    return jsonOk({ ok: true, analytics });
  } catch (e) {
    if (e instanceof EodError) {
      return jsonOk({ ok: false, error: e.message });
    }
    throw e;
  }
}
