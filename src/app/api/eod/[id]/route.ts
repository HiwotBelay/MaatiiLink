import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getEodById, EodError } from "@/lib/eod/service";
import { serializeEod } from "@/lib/eod/serialize";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.EOD_VIEW_BRANCH);
  if (error || !user) return error!;

  const { id } = await params;

  try {
    const report = await getEodById(user, id);
    if (!report) return jsonError("Not found", 404);
    return jsonOk({ ok: true, report: serializeEod(report) });
  } catch (e) {
    if (e instanceof EodError && e.code === "FORBIDDEN") {
      return jsonError(e.message, 403);
    }
    throw e;
  }
}
