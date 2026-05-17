import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function SupervisorPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.DASHBOARD_SUPERVISOR)) {
    redirect("/dashboard");
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, branchCode: true, district: true, isSmartBranch: true },
  });

  return (
    <AppShell user={session}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Supervisor dashboard</h1>
        <p className="text-slate-500">
          Branch compliance overview (full metrics in Sprint 4)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-slate-600">{b.branchCode}</td>
                <td className="px-4 py-3 text-slate-600">{b.district ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {b.isSmartBranch ? "Smart" : "Standard"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        EOD on-time %, incidents, and directive overdue columns will appear in Sprint 4.
      </p>
    </AppShell>
  );
}
