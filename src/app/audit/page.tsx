import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { queryAuditLogs } from "@/lib/audit/query";

export default async function AuditPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.AUDIT_VIEW)) {
    redirect("/dashboard");
  }

  const logs = await queryAuditLogs({ limit: 200 });
  const canExport = hasPermission(session.role, Permission.AUDIT_EXPORT);

  return (
    <AppShell user={session}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
          <p className="text-slate-500">Compliance trail (latest 200 entries)</p>
        </div>
        {canExport && (
          <Link
            href="/api/audit?format=csv"
            className="btn-secondary px-4 py-2 text-sm"
          >
            Export CSV
          </Link>
        )}
      </header>

      <div className="polished-card overflow-hidden rounded-[1.5rem]">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                  {l.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                </td>
                <td className="px-4 py-3 text-xs">{l.user?.email ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{l.action}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {l.entityType}
                  {l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
