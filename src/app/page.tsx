import Link from "next/link";
import { Building2, CheckCircle2, Database, LogIn } from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";

const modules = [
  {
    title: "Digital EOD",
    desc: "Structured end-of-day branch reports",
    sprint: "Sprint 2",
  },
  {
    title: "Incidents",
    desc: "Exceptions with severity and escalation",
    sprint: "Sprint 3",
  },
  {
    title: "HO Directives",
    desc: "Circulars with acknowledgment proof",
    sprint: "Sprint 3",
  },
  {
    title: "Service Desk",
    desc: "IT, facilities, cash logistics tickets",
    sprint: "Sprint 4",
  },
  {
    title: "Supervisor Dashboard",
    desc: "Compliance view across branches",
    sprint: "Sprint 4",
  },
  {
    title: "Audit Log",
    desc: "Every write action recorded",
    sprint: "Sprint 1",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-border bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              Cooperative Bank of Oromia
            </p>
            <div className="mt-2">
              <MaatiiLinkLogo height={48} priority />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Branch-to-Head Office Operations Bridge
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Sprint 1 - Auth live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-10 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">SABA CODERS</h2>
          <p className="max-w-2xl text-muted-foreground">
            Production internal platform for daily EOD reporting, incidents, HO
            directives, service desk, and supervisor dashboards. Built at COOP DX
            Valley.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
            <Link
              href="/api/health"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-slate-50"
            >
              <Database className="h-4 w-4" />
              API health
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <article
              key={m.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="font-semibold">{m.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">{m.sprint}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            Phase 0 complete on your machine when:
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-emerald-900/90">
            <li>
              <code className="rounded bg-white/60 px-1">npm run dev</code> opens this page
            </li>
            <li>
              <code className="rounded bg-white/60 px-1">/api/health</code> shows database connected
            </li>
            <li>Sign in at /login (see docs/DEV_SETUP.md for dev accounts)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
