import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { escalateEod, EodError } from "@/lib/eod/service";
import { serializeEod } from "@/lib/eod/serialize";

const schema = z.object({
  reason: z.string().min(3).max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireApiUser(request, Permission.EOD_LOCK);
  if (error || !user) return error!;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const report = await escalateEod(user, id, parsed.data.reason);
    return jsonOk({ ok: true, report: serializeEod(report) });
  } catch (e) {
    if (e instanceof EodError) {
      const status = e.code === "FORBIDDEN" ? 403 : 400;
      return jsonError(e.message, status);
    }
    throw e;
  }
}
