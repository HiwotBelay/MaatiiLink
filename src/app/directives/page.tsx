import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DirectivePanel } from "@/components/directive/DirectivePanel";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listDirectives } from "@/lib/directive/service";
import { serializeDirective } from "@/lib/directive/serialize";
import { prisma } from "@/lib/prisma";

export default async function DirectivesPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DIRECTIVE_VIEW)) {
    redirect(defaultRouteForRole(session.role));
  }

  const branch = session.branchId
    ? await prisma.branch.findUnique({ where: { id: session.branchId } })
    : null;

  const directives = await listDirectives(session);

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">HO directives</h1>
        <p className="text-slate-500">Policy circulars and compliance acknowledgment</p>
      </header>

      <DirectivePanel
        directives={directives.map((d) =>
          serializeDirective(d, { branchId: session.branchId }),
        )}
        canAck={hasPermission(session.role, Permission.DIRECTIVE_ACK)}
        canPublish={hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)}
      />
    </AppShell>
  );
}
