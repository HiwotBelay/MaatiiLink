import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SupervisorEodTable } from "@/components/eod/SupervisorEodTable";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { getBranchEodSummaryForToday } from "@/lib/eod/branch-summary";
import { getAddisDateString } from "@/lib/eod/constants";

export default async function SupervisorPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DASHBOARD_SUPERVISOR)) {
    redirect("/dashboard");
  }

  const eodRows = await getBranchEodSummaryForToday();

  const onTime = eodRows.filter((r) =>
    ["SUBMITTED", "LOCKED"].includes(r.eodStatus),
  ).length;
  const missing = eodRows.filter((r) => ["MISSING", "LATE"].includes(r.eodStatus)).length;

  return (
    <AppShell user={session}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Supervisor dashboard</h1>
        <p className="text-slate-500">
          EOD compliance — {getAddisDateString()} (Addis Ababa)
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Branches" value={String(eodRows.length)} />
        <StatCard label="EOD submitted" value={String(onTime)} />
        <StatCard label="Missing / late" value={String(missing)} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Today&apos;s EOD by branch</h2>
        <SupervisorEodTable rows={eodRows} />
        <p className="mt-3 text-xs text-slate-500">
          Click Lock after reviewing a submitted EOD. Sprint 4 adds full compliance columns.
        </p>
      </section>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
