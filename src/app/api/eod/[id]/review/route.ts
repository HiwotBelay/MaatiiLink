import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { reviewEod, EodError } from "@/lib/eod/service";
import { serializeEod } from "@/lib/eod/serialize";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireApiUser(request, Permission.EOD_LOCK);
  if (error || !user) return error!;

  const { id } = await params;

  try {
    const report = await reviewEod(user, id);
    return jsonOk({ ok: true, report: serializeEod(report) });
  } catch (e) {
    if (e instanceof EodError) {
      const status = e.code === "FORBIDDEN" ? 403 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
