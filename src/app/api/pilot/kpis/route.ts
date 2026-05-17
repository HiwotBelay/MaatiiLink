import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { computePilotKpis } from "@/lib/pilot/kpis";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.PILOT_VIEW);
  if (error || !user) return error!;

  const days = Number(request.nextUrl.searchParams.get("days") ?? 14);
  const kpis = await computePilotKpis(Number.isFinite(days) ? days : 14);

  return jsonOk({ ok: true, kpis });
}
