import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SecurityConsole } from "@/components/security/SecurityConsole";
import { requireServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { listLoginActivityForUser } from "@/lib/security/login-activity";

export default async function SecurityPage() {
  const session = await requireServerSession();

  if (!hasPermission(session.role, Permission.SECURITY_VIEW)) {
    redirect("/dashboard");
  }

  const branch = session.branchId
    ? await prisma.branch.findUnique({
        where: { id: session.branchId },
        select: { name: true, branchCode: true },
      })
    : null;

  const activities = await listLoginActivityForUser(session.sub, 25);
  const activeSessions = await prisma.userSession.findMany({
    where: {
      userId: session.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 10,
  });

  return (
    <AppShell
      user={{ name: session.name, email: session.email, role: session.role }}
      branchLabel={branch ? `${branch.branchCode} — ${branch.name}` : null}
    >
      <PageHeader
        title="Security Center"
        description="Session control, sign-in history, and access monitoring"
      />
      <SecurityConsole
        activities={activities}
        sessions={activeSessions}
        role={session.role}
      />
    </AppShell>
  );
}
