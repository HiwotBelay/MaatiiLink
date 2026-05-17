import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "@/lib/auth/server";
import { defaultRouteForRole } from "@/lib/rbac";
import { getTodayEod } from "@/lib/eod/service";
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

  const todayEod = session.branchId ? await getTodayEod(session) : null;

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
      desc: "Sprint 3",
      icon: AlertTriangle,
      status: "Coming soon",
      href: "#",
      live: false,
    },
    {
      title: "Directives",
      desc: "Sprint 3",
      icon: Megaphone,
      status: "Coming soon",
      href: "#",
      live: false,
    },
    {
      title: "Service desk",
      desc: "Sprint 4",
      icon: Ticket,
      status: "Coming soon",
      href: "#",
      live: false,
    },
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

      {/* grid */}
      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#00529b]/30 ${!c.live ? "pointer-events-none opacity-80" : ""}`}
          >
            <header className="mb-2 flex items-center gap-2">
              <c.icon className="h-5 w-5 text-[#00529b]" />
              <h2 className="font-semibold">{c.title}</h2>
            </header>
            <p className="text-sm text-slate-500">{c.desc}</p>
            <p className={`mt-2 text-xs font-medium ${c.statusColor ?? "text-amber-700"}`}>
              {c.status}
            </p>
          </Link>
        ))}
      </section>

      {branch && (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="h-4 w-4" />
          {branch.isSmartBranch ? "Smart Branch" : "Branch"} · {branch.district ?? "—"}
        </p>
      )}
    </AppShell>
  );
}
