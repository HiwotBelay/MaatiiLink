import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { getDirectiveAnalytics } from "@/lib/directive/analytics";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.DIRECTIVE_VIEW,
  );
  if (error || !user) return error!;

  const analytics = await getDirectiveAnalytics(user);
  return jsonOk({ ok: true, analytics });
}
