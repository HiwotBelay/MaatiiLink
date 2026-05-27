import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuideBanner } from "@/components/layout/RoleGuideBanner";
import { KnowledgeHub } from "@/components/directive/KnowledgeHub";
import { isBranchManager, isBranchStaff } from "@/lib/roles/branch-staff";
import { KnowledgeAnalytics } from "@/components/directive/KnowledgeAnalytics";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission, defaultRouteForRole } from "@/lib/rbac";
import { listDirectives, getPinnedAndLatest } from "@/lib/directive/service";
import { serializeDirective } from "@/lib/directive/serialize";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ pendingAck?: string }>;
};

export default async function DirectivesPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const pendingAck = params.pendingAck === "1";

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
        title={
          isBranchManager(session.role)
            ? "HO policies & acknowledgments"
            : "Operational knowledge & procedures"
        }
        description={
          isBranchManager(session.role)
            ? "Read mandatory Head Office procedures and acknowledge on behalf of your branch before deadlines"
            : "Find the latest Head Office directives by area — search, category, or quick lookup. No phone calls to HO for routine procedures."
        }
      />

      {isBranchStaff(session.role) && (
        <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          <strong className="text-[var(--foreground)]">Branch staff:</strong> you can read and
          search all procedures. Mandatory acknowledgments are done by your{" "}
          <strong className="text-[var(--foreground)]">branch manager</strong>.
        </p>
      )}

      {isBranchManager(session.role) && (
        <RoleGuideBanner role={session.role} variant="manager" />
      )}

      {showAnalytics && <KnowledgeAnalytics />}

      <KnowledgeHub
        initialDirectives={directives.map((d) => serializeDirective(d, serializeOpts))}
        pinned={pinned.map((d) => serializeDirective(d, serializeOpts))}
        latest={latest.map((d) => serializeDirective(d, serializeOpts))}
        canAck={hasPermission(session.role, Permission.DIRECTIVE_ACK)}
        canPublish={hasPermission(session.role, Permission.DIRECTIVE_PUBLISH)}
        defaultPendingAck={
          pendingAck && hasPermission(session.role, Permission.DIRECTIVE_ACK)
        }
      />
    </AppShell>
  );
}
