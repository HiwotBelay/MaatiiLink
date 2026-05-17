import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TicketPanel } from "@/components/ticket/TicketPanel";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listTickets, listAssignableUsers } from "@/lib/ticket/service";
import { serializeTicket } from "@/lib/ticket/serialize";
import { prisma } from "@/lib/prisma";

export default async function TicketsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canView =
    hasPermission(session.role, Permission.TICKET_VIEW_BRANCH) ||
    hasPermission(session.role, Permission.TICKET_VIEW_ALL);

  if (!canView) redirect(defaultRouteForRole(session.role));

  const branch = session.branchId
    ? await prisma.branch.findUnique({ where: { id: session.branchId } })
    : null;

  const [tickets, assignees] = await Promise.all([
    listTickets(session),
    hasPermission(session.role, Permission.TICKET_ASSIGN)
      ? listAssignableUsers()
      : Promise.resolve([]),
  ]);

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Service desk</h1>
        <p className="text-slate-500">IT, facilities, and cash logistics requests</p>
      </header>

      <TicketPanel
        tickets={tickets.map(serializeTicket)}
        canCreate={hasPermission(session.role, Permission.TICKET_CREATE)}
        canAssign={hasPermission(session.role, Permission.TICKET_ASSIGN)}
        assignees={assignees}
        showBranch={hasPermission(session.role, Permission.TICKET_VIEW_ALL)}
      />
    </AppShell>
  );
}
