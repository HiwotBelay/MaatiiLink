import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { listEodReports, upsertEodDraft, getTodayEod, EodError } from "@/lib/eod/service";
import { serializeEod } from "@/lib/eod/serialize";
import { eodFormSchema } from "@/lib/eod/validation";
import { getAddisDateString } from "@/lib/eod/constants";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.EOD_VIEW_BRANCH);
  if (error || !user) return error!;

  const { searchParams } = request.nextUrl;
  const today = searchParams.get("today") === "1";
  const branchId = searchParams.get("branchId") ?? undefined;
  const days = Number(searchParams.get("days") ?? 30);

  try {
    if (today) {
      const report = await getTodayEod(user, branchId);
      return jsonOk({
        ok: true,
        today: getAddisDateString(),
        report: report ? serializeEod(report) : null,
      });
    }

    const reports = await listEodReports(user, { branchId, days });
    return jsonOk({
      ok: true,
      reports: reports.map(serializeEod),
    });
  } catch (e) {
    if (e instanceof EodError) return jsonError(e.message, 400);
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.EOD_DRAFT);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = eodFormSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  const branchId = new URL(request.url).searchParams.get("branchId") ?? undefined;

  try {
    const report = await upsertEodDraft(user, parsed.data, branchId);
    return jsonOk({ ok: true, report: serializeEod(report) });
  } catch (e) {
    if (e instanceof EodError) {
      const status = e.code === "FORBIDDEN" ? 403 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
