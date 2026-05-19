import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";
import { getTodayEod } from "@/lib/eod/service";
import { countOpenIncidentsForBranch } from "@/lib/incident/service";
import { countOverdueAcksForBranch } from "@/lib/directive/service";
import { countOpenTicketsForBranch } from "@/lib/ticket/service";
import { prisma } from "@/lib/prisma";
import { getAddisDateString } from "@/lib/eod/constants";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (["SUPERVISOR", "HO_ADMIN", "AUDITOR"].includes(session.role)) {
    redirect(defaultRouteForRole(session.role));
  }

  if (!session.branchId) {
    return (
      <AppShell user={session}>
        <PageHeader
          title="Dashboard"
          description="Your account is not assigned to a branch."
        />
      </AppShell>
    );
  }

  const [branch, todayEod, openIncidents, overdueDirectives, openTickets] =
    await Promise.all([
      prisma.branch.findUnique({ where: { id: session.branchId } }),
      getTodayEod(session),
      countOpenIncidentsForBranch(session.branchId),
      countOverdueAcksForBranch(session.branchId),
      countOpenTicketsForBranch(session.branchId),
    ]);

  const eodStatus = !todayEod
    ? { label: "Not started", tone: "danger" as const }
    : todayEod.status === "DRAFT"
      ? { label: "Draft", tone: "warning" as const }
      : todayEod.status === "SUBMITTED"
        ? { label: "Submitted", tone: "default" as const }
        : { label: "Locked", tone: "success" as const };

  const modules = [
    {
      title: "EOD today",
      value: eodStatus.label,
      tone: eodStatus.tone,
      href: "/eod",
    },
    {
      title: "Open incidents",
      value: String(openIncidents),
      tone: openIncidents > 0 ? ("warning" as const) : ("success" as const),
      href: "/incidents",
    },
    {
      title: "Overdue directives",
      value: String(overdueDirectives),
      tone: overdueDirectives > 0 ? ("danger" as const) : ("success" as const),
      href: "/directives",
    },
    {
      title: "Open tickets",
      value: String(openTickets),
      tone: openTickets > 0 ? ("warning" as const) : ("default" as const),
      href: "/tickets",
    },
  ];

  const branchLabel = branch
    ? `${branch.name} (${branch.branchCode})`
    : null;

  return (
    <AppShell user={session} branchLabel={branchLabel}>
      <PageHeader
        title="Dashboard"
        description={`${getAddisDateString()} · ${branch?.name ?? "Branch"}`}
      />

      <section className="dashboard-stat-grid">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="dashboard-stat-link">
            <StatCard label={m.title} value={m.value} tone={m.tone} />
            <span className="dashboard-stat-arrow">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      {branch && (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          {branch.isSmartBranch ? "Smart Branch" : "Branch"} · {branch.district ?? "—"}
        </p>
      )}
    </AppShell>
  );
}
