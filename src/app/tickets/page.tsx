import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceOpsCenter } from "@/components/ticket/ServiceOpsCenter";
import { ServiceOpsDashboard } from "@/components/ticket/ServiceOpsDashboard";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listTickets, listAssignableUsers } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";
import { prisma } from "@/lib/prisma";
import { isBranchManager, isBranchStaff } from "@/lib/roles/branch-staff";

export default async function TicketsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canView =
    hasPermission(session.role, Permission.TICKET_VIEW_BRANCH) ||
    hasPermission(session.role, Permission.TICKET_VIEW_ALL);

  if (!canView) redirect(defaultRouteForRole(session.role));

  const isOpsView = hasPermission(session.role, Permission.TICKET_VIEW_ALL);
  const canAssign = hasPermission(session.role, Permission.TICKET_ASSIGN);

  const branch = session.branchId
    ? await prisma.branch.findUnique({ where: { id: session.branchId } })
    : null;

  const viewer = {
    id: session.sub,
    role: session.role,
    branchId: session.branchId,
  };

  const [tickets, assignees] = await Promise.all([
    listTickets(viewer),
    canAssign ? listAssignableUsers() : Promise.resolve([]),
  ]);

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <PageHeader
        title={
          isBranchStaff(session.role) || isBranchManager(session.role)
            ? "Service requests"
            : "Service operations center"
        }
        description={
          isBranchManager(session.role)
            ? "Open IT, facilities, or cash logistics requests for your branch and track SLA status"
            : isBranchStaff(session.role)
              ? "Request IT, facilities, or cash logistics support for your branch"
              : "Department routing · SLA tracking · assignment queue · escalation"
        }
      />

      {isOpsView && <ServiceOpsDashboard />}

      <ServiceOpsCenter
        initialTickets={tickets.map((t) =>
          serializeTicket(t, { includeInternalNotes: canAssign }),
        )}
        canCreate={hasPermission(session.role, Permission.TICKET_CREATE)}
        canAssign={canAssign}
        assignees={assignees}
        showBranch={isOpsView}
      />
    </AppShell>
  );
}
