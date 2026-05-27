import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { reviewEod, EodError } from "@/lib/eod/service";
import { serializeEod } from "@/lib/eod/serialize";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.EOD_LOCK);
  if (error || !user) return error!;

  const { id } = await params;

  try {
    const report = await reviewEod(user, id);
    return jsonOk({ ok: true, report: serializeEod(report) });
  } catch (e) {
    if (e instanceof EodError) {
      const status =
        e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
