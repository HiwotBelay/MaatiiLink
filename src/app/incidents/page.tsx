import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { IncidentPanel } from "@/components/incident/IncidentPanel";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listIncidents } from "@/lib/incident/service";
import { serializeIncident } from "@/lib/incident/serialize";
import { prisma } from "@/lib/prisma";

export default async function IncidentsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canView =
    hasPermission(session.role, Permission.INCIDENT_VIEW_BRANCH) ||
    hasPermission(session.role, Permission.INCIDENT_VIEW_ALL);

  if (!canView) redirect(defaultRouteForRole(session.role));

  const isSupervisorView = hasPermission(session.role, Permission.INCIDENT_VIEW_ALL);

  const branch = session.branchId
    ? await prisma.branch.findUnique({ where: { id: session.branchId } })
    : null;

  const incidents = await listIncidents(session);

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Incidents</h1>
        <p className="text-slate-500">Exception and escalation log</p>
      </header>

      <IncidentPanel
        incidents={incidents.map(serializeIncident)}
        canCreate={hasPermission(session.role, Permission.INCIDENT_CREATE)}
        canUpdate={hasPermission(session.role, Permission.INCIDENT_UPDATE)}
        showBranch={isSupervisorView}
      />
    </AppShell>
  );
}
