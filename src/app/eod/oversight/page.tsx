import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComplianceTable } from "@/components/supervisor/ComplianceTable";
import { EodSupervisorAnalytics } from "@/components/eod/EodSupervisorAnalytics";
import { EodAlertsPanel } from "@/components/eod/EodAlertsPanel";
import { SupervisorToolbar } from "@/components/supervisor/SupervisorToolbar";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole, hasPermission, Permission } from "@/lib/rbac";
import { getBranchComplianceSummary } from "@/lib/supervisor/compliance-summary";
import { getAddisDateString } from "@/lib/eod/constants";
import { prisma } from "@/lib/prisma";

/** National EOD oversight — Head Office and roles with bank-wide EOD view. */
export default async function EodOversightPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.EOD_VIEW_ALL)) {
    redirect(defaultRouteForRole(session.role));
  }

  const { rows } = await getBranchComplianceSummary();

  const branches = await prisma.branch.findMany({
    select: { district: true, region: true },
  });
  const districts = [...new Set(branches.map((b) => b.district).filter(Boolean))] as string[];
  const regions = [...new Set(branches.map((b) => b.region).filter(Boolean))] as string[];

  const missing = rows.filter((r) =>
    ["MISSING", "LATE", "ESCALATED"].includes(r.eodStatus),
  ).length;

  return (
    <AppShell user={session} branchLabel={null}>
      <PageHeader
        title="National EOD oversight"
        description={`All branches · ${getAddisDateString()} (Addis Ababa / EAT)`}
      />

      <p className="mb-6 text-sm text-slate-600">
        Review submitted end-of-day reports, approve and lock records, and monitor late or
        missing submissions across the network.{" "}
        <Link href="/ho" className="font-medium text-[#00529b] hover:underline">
          ← Head Office home
        </Link>
      </p>

      <section className="dashboard-stat-grid mb-6 lg:grid-cols-3">
        <article className="stat-card">
          <p className="stat-card-label">Branches tracked</p>
          <p className="stat-card-value">{rows.length}</p>
        </article>
        <article className={`stat-card ${missing > 0 ? "stat-card-warning" : ""}`}>
          <p className="stat-card-label">Missing / late today</p>
          <p className="stat-card-value">{missing}</p>
        </article>
        <article className="stat-card stat-card-success">
          <p className="stat-card-label">Submitted / reviewed</p>
          <p className="stat-card-value">
            {rows.filter((r) => ["SUBMITTED", "REVIEWED"].includes(r.eodStatus)).length}
          </p>
        </article>
      </section>

      <SupervisorToolbar districts={districts} regions={regions} />

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <EodSupervisorAnalytics />
        <EodAlertsPanel />
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          Branch EOD status (today)
        </h2>
        <ComplianceTable rows={rows} />
      </section>
    </AppShell>
  );
}
