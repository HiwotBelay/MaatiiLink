import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";
import { getTodayEod } from "@/lib/eod/service";
import { countOpenIncidentsForBranch } from "@/lib/incident/service";
import { countOverdueAcksForBranch } from "@/lib/directive/service";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  FileText,
  Megaphone,
  Sparkles,
  Ticket,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (["SUPERVISOR", "HO_ADMIN", "AUDITOR"].includes(session.role)) {
    redirect(defaultRouteForRole(session.role));
  }

  const [branch, todayEod, openIncidents, overdueDirectives] = await Promise.all([
    session.branchId
      ? prisma.branch.findUnique({ where: { id: session.branchId } })
      : Promise.resolve(null),
    session.branchId ? getTodayEod(session) : Promise.resolve(null),
    session.branchId
      ? countOpenIncidentsForBranch(session.branchId)
      : Promise.resolve(0),
    session.branchId
      ? countOverdueAcksForBranch(session.branchId)
      : Promise.resolve(0),
  ]);

  const eodLabel = !todayEod
    ? { text: "Not started", color: "text-red-600" }
    : todayEod.status === "DRAFT"
      ? { text: "Draft", color: "text-amber-600" }
      : todayEod.status === "SUBMITTED"
        ? { text: "Submitted", color: "text-blue-600" }
        : { text: "Locked", color: "text-emerald-600" };

  const cards: {
    title: string;
    desc: string;
    icon: typeof FileText;
    status: string;
    statusColor?: string;
    href: string;
    live: boolean;
  }[] = [
    {
      title: "EOD Today",
      desc: "End of day report",
      icon: FileText,
      status: eodLabel.text,
      statusColor: eodLabel.color,
      href: "/eod",
      live: true,
    },
    {
      title: "Incidents",
      desc: "Exception log",
      icon: AlertTriangle,
      status: openIncidents > 0 ? `${openIncidents} open` : "None open",
      statusColor: openIncidents > 0 ? "text-amber-600" : "text-emerald-600",
      href: "/incidents",
      live: true,
    },
    {
      title: "Directives",
      desc: "HO circulars",
      icon: Megaphone,
      status:
        overdueDirectives > 0
          ? `${overdueDirectives} overdue`
          : "Up to date",
      statusColor: overdueDirectives > 0 ? "text-red-600" : "text-emerald-600",
      href: "/directives",
      live: true,
    },
    {
      title: "Service desk",
      desc: "IT & facilities requests",
      icon: Ticket,
      status: "Open tickets",
      href: "/tickets",
      live: true,
    },
  ];

  return (
    <AppShell
      user={session}
      branchLabel={branch ? `${branch.name} (${branch.branchCode})` : null}
    >
      <div className="glass-card mb-8 overflow-hidden rounded-[2rem] p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="page-kicker">Branch Workspace</p>
            <h1 className="mt-3 text-4xl font-black">
              Good day, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Your branch operations cockpit for today’s reporting, exceptions,
              service requests, and Head Office communication.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-200" />
              <p className="text-sm font-bold">Live branch view</p>
            </div>
            <p className="mt-2 text-xs text-white/60">
              {branch ? `${branch.name} · ${branch.branchCode}` : "No branch assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className={`polished-card hover-lift rounded-3xl p-5 ${!c.live ? "pointer-events-none opacity-80" : ""}`}
          >
            <header className="mb-5 flex items-center justify-between gap-2">
              <span className="rounded-2xl bg-blue-50 p-3 text-[var(--primary)]">
                <c.icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </header>
            <h2 className="font-black text-slate-950">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            <p className={`mt-4 text-xs font-black uppercase tracking-wide ${c.statusColor ?? "text-amber-700"}`}>
              {c.status}
            </p>
          </Link>
        ))}
      </section>

      {branch && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <Building2 className="h-4 w-4" />
          {branch.isSmartBranch ? "Smart Branch" : "Branch"} · {branch.district ?? "—"}
        </p>
      )}
    </AppShell>
  );
}
