import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ComplianceTable } from "@/components/supervisor/ComplianceTable";
import { SupervisorToolbar } from "@/components/supervisor/SupervisorToolbar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
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
    ["SUBMITTED", "LOCKED"].includes(r.eodStatus),
  ).length;
  const missing = rows.filter((r) => ["MISSING", "LATE"].includes(r.eodStatus)).length;

  const branches = await prisma.branch.findMany({
    select: { district: true, region: true },
  });
  const districts = [...new Set(branches.map((b) => b.district).filter(Boolean))] as string[];
  const regions = [...new Set(branches.map((b) => b.region).filter(Boolean))] as string[];

  return (
    <AppShell user={session}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Supervisor dashboard</h1>
        <p className="text-slate-500">
          Branch compliance — {getAddisDateString()} (Addis Ababa)
        </p>
      </header>

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

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Branches" value={String(rows.length)} />
        <StatCard label="EOD submitted" value={String(onTime)} />
        <StatCard label="Missing / late EOD" value={String(missing)} />
        <StatCard label="Critical incidents" value={String(totalCriticalOpen)} />
        <StatCard label="Overdue directive acks" value={String(totalOverdueAcks)} />
      </section>

      <section className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link href="/incidents" className="font-medium text-[#00529b] hover:underline">
          All incidents →
        </Link>
        <Link href="/directives" className="font-medium text-[#00529b] hover:underline">
          All directives →
        </Link>
        {hasPermission(session.role, Permission.PILOT_VIEW) && (
          <Link href="/pilot" className="font-medium text-[#00529b] hover:underline">
            Pilot KPIs & feedback →
          </Link>
        )}
      </section>

      <SupervisorToolbar districts={districts} regions={regions} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">Branch compliance</h2>
        <ComplianceTable rows={rows} />
      </section>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="polished-card hover-lift rounded-3xl p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
