import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IncidentCommandCenter } from "@/components/incident/IncidentCommandCenter";
import { IncidentAnalyticsPanel } from "@/components/incident/IncidentAnalyticsPanel";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { canAssignIncidents, toIncidentViewer } from "@/lib/incident/access";
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

  const incidents = await listIncidents(toIncidentViewer(session));

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.branchCode} — ${branch.name}` : null}
    >
      <PageHeader
        title="Incident command center"
        description="Operational incident management · SLA · role-based visibility · compliance escalation"
        actions={<NotificationBell />}
      />

      {isSupervisorView && <IncidentAnalyticsPanel />}

      <IncidentCommandCenter
        incidents={incidents.map(serializeIncident)}
        canCreate={hasPermission(session.role, Permission.INCIDENT_CREATE)}
        canUpdate={hasPermission(session.role, Permission.INCIDENT_UPDATE)}
        canAssign={canAssignIncidents(session.role)}
        showBranch={isSupervisorView}
      />
    </AppShell>
  );
}
