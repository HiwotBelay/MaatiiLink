import { NextRequest, NextResponse } from "next/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonForbidden, jsonOk } from "@/lib/api/http";
import { auditLogsToCsv, queryAuditLogs } from "@/lib/audit/query";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.AUDIT_VIEW);
  if (error || !user) return error!;

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  const logs = await queryAuditLogs({ from, to });

  if (format === "csv") {
    if (!hasPermission(user.role, Permission.AUDIT_EXPORT)) {
      return jsonForbidden();
    }
    const csv = auditLogsToCsv(logs);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maatiilink-audit-${Date.now()}.csv"`,
      },
    });
  }

  return jsonOk({
    ok: true,
    logs: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      user: l.user,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
