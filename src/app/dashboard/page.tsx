import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchDashboard } from "@/components/dashboard/BranchDashboard";
import { getServerSession, redirectToLogin } from "@/lib/auth/server";
import { defaultRouteForRole, hasPermission, Permission } from "@/lib/rbac";
import { getTodayEod } from "@/lib/eod/service";
import { countOpenIncidentsForBranch } from "@/lib/incident/service";
import { countOverdueAcksForBranch } from "@/lib/directive/service";
import { countOpenTicketsForBranch } from "@/lib/ticket/service";
import { prisma } from "@/lib/prisma";
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirectToLogin("invalid_session");

  if (hasPermission(session.role, Permission.DASHBOARD_SUPERVISOR)) {
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
    : todayEod.status === "PENDING"
      ? { label: "Pending", tone: "warning" as const }
      : todayEod.status === "SUBMITTED"
        ? { label: "Submitted", tone: "default" as const }
        : todayEod.status === "LATE"
          ? { label: "Late", tone: "warning" as const }
          : todayEod.status === "REVIEWED"
            ? { label: "Reviewed", tone: "success" as const }
            : { label: todayEod.status, tone: "default" as const };

  const branchLabel = branch
    ? `${branch.name} (${branch.branchCode})`
    : null;

  return (
    <AppShell user={session} branchLabel={branchLabel}>
      {branch && (
        <BranchDashboard
          user={session}
          branch={branch}
          eodStatus={eodStatus}
          openIncidents={openIncidents}
          overdueDirectives={overdueDirectives}
          openTickets={openTickets}
        />
      )}
    </AppShell>
  );
}
