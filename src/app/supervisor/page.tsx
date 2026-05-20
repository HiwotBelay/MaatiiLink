import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { ComplianceTable } from "@/components/supervisor/ComplianceTable";
import { EodSupervisorAnalytics } from "@/components/eod/EodSupervisorAnalytics";
import { EodAlertsPanel } from "@/components/eod/EodAlertsPanel";
import { SupervisorToolbar } from "@/components/supervisor/SupervisorToolbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, isHeadOfficeHomeRole, Permission } from "@/lib/rbac";
import { getBranchComplianceSummary } from "@/lib/supervisor/compliance-summary";
import { getAddisDateString } from "@/lib/eod/constants";

export default async function SupervisorPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DASHBOARD_SUPERVISOR)) {
    redirect("/dashboard");
  }

  const { rows, criticalIncidents, totalCriticalOpen, totalOverdueAcks } =
    await getBranchComplianceSummary();

  const onTime = rows.filter((r) =>
    ["SUBMITTED", "REVIEWED"].includes(r.eodStatus),
  ).length;
  const missing = rows.filter((r) =>
    ["MISSING", "LATE", "ESCALATED"].includes(r.eodStatus),
  ).length;

  const branches = await prisma.branch.findMany({
    select: { district: true, region: true },
  });
  const districts = [...new Set(branches.map((b) => b.district).filter(Boolean))] as string[];
  const regions = [...new Set(branches.map((b) => b.region).filter(Boolean))] as string[];

  return (
    <AppShell user={session}>
      <PageHeader
        title={
          isHeadOfficeHomeRole(session.role)
            ? "National branch compliance"
            : "Supervisor dashboard"
        }
        description={`Branch compliance · ${getAddisDateString()} (Addis Ababa / EAT)`}
      />

      {totalCriticalOpen > 0 && (
        <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm">
          <strong>{totalCriticalOpen} critical incident(s)</strong> require attention.{" "}
          <Link href="/incidents" className="font-medium underline">
            View incidents
          </Link>
          <ul className="mt-2 list-inside list-disc text-red-800">
            {criticalIncidents.slice(0, 5).map((i) => (
              <li key={i.id}>
                {i.title} (branch id: {i.branchId.slice(0, 8)}…)
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="dashboard-stat-grid mb-6 lg:grid-cols-5">
        <StatCard label="Branches" value={String(rows.length)} />
        <StatCard
          label="EOD submitted"
          value={String(onTime)}
          tone="success"
        />
        <StatCard
          label="Missing / late EOD"
          value={String(missing)}
          tone={missing > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Critical incidents"
          value={String(totalCriticalOpen)}
          tone={totalCriticalOpen > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Overdue directive acks"
          value={String(totalOverdueAcks)}
          tone={totalOverdueAcks > 0 ? "danger" : "success"}
        />
      </section>

      <section className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/incidents" className="font-medium text-[#00529b] hover:underline">
          All incidents →
        </Link>
        <Link href="/directives" className="font-medium text-[#00529b] hover:underline">
          Knowledge center →
        </Link>
        {hasPermission(session.role, Permission.PILOT_VIEW) && (
          <Link href="/pilot" className="font-medium text-[#00529b] hover:underline">
            Pilot KPIs & feedback →
          </Link>
        )}
      </section>

      <SupervisorToolbar districts={districts} regions={regions} />

      <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <EodSupervisorAnalytics />
        <EodAlertsPanel />
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          Branch compliance
        </h2>
        <ComplianceTable rows={rows} />
      </section>
    </AppShell>
  );
}
