import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IncidentCommandCenter } from "@/components/incident/IncidentCommandCenter";
import { IncidentAnalyticsPanel } from "@/components/incident/IncidentAnalyticsPanel";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { canAssignIncidents, toIncidentViewer } from "@/lib/incident/access";
import { isBranchManager, isBranchStaff } from "@/lib/roles/branch-staff";
import { RoleGuideBanner } from "@/components/layout/RoleGuideBanner";
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
        title={
          isBranchStaff(session.role)
            ? "Report an incident"
            : isBranchManager(session.role)
              ? "Branch incidents"
              : "Incident command center"
        }
        description={
          isBranchStaff(session.role)
            ? "Report fraud, downtime, cash variance, or security issues at your branch — attach evidence when you can"
            : isBranchManager(session.role)
              ? "Report new issues, update resolution status, and attach evidence for your branch"
              : "Operational incident management · SLA · role-based visibility · compliance escalation"
        }
        actions={<NotificationBell />}
      />

      {isBranchStaff(session.role) && <RoleGuideBanner role={session.role} variant="staff" />}
      {isBranchManager(session.role) && <RoleGuideBanner role={session.role} variant="manager" />}

      {isSupervisorView && <IncidentAnalyticsPanel />}

      <IncidentCommandCenter
        incidents={incidents.map(serializeIncident)}
        canCreate={hasPermission(session.role, Permission.INCIDENT_CREATE)}
        canUpdate={hasPermission(session.role, Permission.INCIDENT_UPDATE)}
        canAttachEvidence={
          hasPermission(session.role, Permission.INCIDENT_CREATE) ||
          hasPermission(session.role, Permission.INCIDENT_UPDATE)
        }
        canAssign={canAssignIncidents(session.role)}
        showBranch={isSupervisorView}
      />
    </AppShell>
  );
}
