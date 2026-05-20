import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { KnowledgeHub } from "@/components/directive/KnowledgeHub";
import { KnowledgeAnalytics } from "@/components/directive/KnowledgeAnalytics";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listDirectives, getPinnedAndLatest } from "@/lib/directive/service";
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

  const viewer = {
    id: session.sub,
    role: session.role,
    branchId: session.branchId,
  };

  const [directives, { pinned, latest }] = await Promise.all([
    listDirectives(viewer),
    getPinnedAndLatest(viewer),
  ]);

  const serializeOpts = {
    branchId: session.branchId,
    userId: session.sub,
  };

  const showAnalytics =
    hasPermission(session.role, Permission.DIRECTIVE_PUBLISH) ||
    hasPermission(session.role, Permission.DIRECTIVE_ACK);

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <PageHeader
        title="Operational knowledge & procedures"
        description="Find the latest Head Office directives by area — search, category, or quick lookup. No phone calls to HO for routine procedures."
      />

      {showAnalytics && <KnowledgeAnalytics />}

      <KnowledgeHub
        initialDirectives={directives.map((d) => serializeDirective(d, serializeOpts))}
        pinned={pinned.map((d) => serializeDirective(d, serializeOpts))}
        latest={latest.map((d) => serializeDirective(d, serializeOpts))}
        canAck={hasPermission(session.role, Permission.DIRECTIVE_ACK)}
        canPublish={hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)}
      />
    </AppShell>
  );
}
