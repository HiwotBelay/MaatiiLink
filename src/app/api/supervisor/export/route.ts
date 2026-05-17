import { NextRequest, NextResponse } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { getBranchComplianceSummary } from "@/lib/supervisor/compliance-summary";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.DASHBOARD_SUPERVISOR);
  if (error || !user) return error!;

  const { searchParams } = request.nextUrl;
  const district = searchParams.get("district")?.trim() || undefined;
  const region = searchParams.get("region")?.trim() || undefined;

  const { rows } = await getBranchComplianceSummary();
  const filtered = rows.filter((r) => {
    if (district && r.district !== district) return false;
    if (region && r.region !== region) return false;
    return true;
  });

  const header =
    "branchCode,branchName,district,eodStatus,openIncidents,overdueDirectives";
  const lines = filtered.map((r) =>
    [
      r.branchCode,
      `"${r.name.replace(/"/g, '""')}"`,
      r.district ?? "",
      r.eodStatus,
      r.openIncidents,
      r.overdueDirectives,
    ].join(","),
  );

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maatiilink-compliance-${Date.now()}.csv"`,
    },
  });
}
