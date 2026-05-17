import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import { getServerSession } from "@/lib/auth/server";
import { hasPermission, Permission } from "@/lib/rbac";
import { getOpsStatus } from "@/lib/ops/status";

export default async function OpsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, Permission.OPS_VIEW)) {
    redirect("/supervisor");
  }

  const status = await getOpsStatus();

  return (
    <AppShell user={session}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Go-live operations</h1>
        <p className="text-slate-500">Phase 6 — production readiness and national rollout</p>
        <p className="mt-2 text-sm">
          <Link href="/admin" className="font-medium text-[#00529b] hover:underline">
            User & branch admin →
          </Link>
          {" · "}
          <a
            href="/api/health"
            className="font-medium text-[#00529b] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Public health JSON
          </a>
        </p>
      </header>

      <OpsDashboard initial={status} />
    </AppShell>
  );
}
