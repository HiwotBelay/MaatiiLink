import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Building2, FileText, AlertTriangle, Megaphone, Ticket } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (["SUPERVISOR", "HO_ADMIN", "AUDITOR"].includes(session.role)) {
    redirect(defaultRouteForRole(session.role));
  }

  const branch = session.branchId
    ? await prisma.branch.findUnique({ where: { id: session.branchId } })
    : null;

  const cards = [
    { title: "EOD Today", desc: "Sprint 2", icon: FileText, status: "Coming soon" },
    { title: "Incidents", desc: "Sprint 3", icon: AlertTriangle, status: "Coming soon" },
    { title: "Directives", desc: "Sprint 3", icon: Megaphone, status: "Coming soon" },
    { title: "Service desk", desc: "Sprint 4", icon: Ticket, status: "Coming soon" },
  ];

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good day, {session.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500">Branch operations dashboard</p>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Sprint 1 complete: you are signed in with role{" "}
        <strong>{session.role.replace(/_/g, " ")}</strong>. Modules below ship in
        upcoming sprints.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <article
            key={c.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <c.icon className="h-5 w-5 text-[#00529b]" />
              <h2 className="font-semibold">{c.title}</h2>
            </div>
            <p className="text-sm text-slate-500">{c.desc}</p>
            <p className="mt-2 text-xs font-medium text-amber-700">{c.status}</p>
          </article>
        ))}
      </div>

      {branch && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="h-4 w-4" />
          {branch.isSmartBranch ? "Smart Branch" : "Branch"} · {branch.district ?? "—"}
        </div>
      )}
    </AppShell>
  );
}
