import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.ADMIN_USERS)) {
    redirect("/supervisor");
  }

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { branch: { select: { name: true, branchCode: true } } },
    }),
    prisma.branch.findMany({
      orderBy: { branchCode: "asc" },
    }),
  ]);

  return (
    <AppShell user={session}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">HO administration</h1>
        <p className="text-slate-500">
          Provision users and branches for production — do not use seed on live DB
        </p>
        <p className="mt-2 text-sm">
          <Link href="/ops" className="font-medium text-[#00529b] hover:underline">
            Go-live status →
          </Link>
        </p>
      </header>

      <AdminConsole
        initialUsers={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          branch: u.branch,
        }))}
        initialBranches={branches}
      />
    </AppShell>
  );
}
