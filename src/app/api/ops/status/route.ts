import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { getOpsStatus } from "@/lib/ops/status";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.OPS_VIEW);
  if (error || !user) return error!;

  const status = await getOpsStatus();
  return jsonOk({ ok: true, ...status });
}
