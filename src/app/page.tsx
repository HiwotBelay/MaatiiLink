import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileCheck2,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";

const modules = [
  {
    title: "Digital EOD",
    desc: "Structured end-of-day branch reports",
    icon: FileCheck2,
  },
  {
    title: "Incidents",
    desc: "Exceptions with severity and escalation",
    icon: Activity,
  },
  {
    title: "HO Directives",
    desc: "Circulars with acknowledgment proof",
    icon: Megaphone,
  },
  {
    title: "Service Desk",
    desc: "IT, facilities, cash logistics tickets",
    icon: TicketCheck,
  },
  {
    title: "Supervisor Dashboard",
    desc: "Compliance view across branches",
    icon: Building2,
  },
  {
    title: "Audit Log",
    desc: "Every write action recorded",
    icon: ShieldCheck,
  },
];

const metrics = [
  ["6", "Core workflows"],
  ["24/7", "Health visibility"],
  ["100%", "Audited writes"],
];

export default function HomePage() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -left-20 top-28 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-slate-950/10 blur-3xl" />

      <header className="relative z-10 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <MaatiiLinkLogo height={44} priority />
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[var(--primary)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-5 py-2 text-sm"
            >
              Request access
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-14 sm:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="reveal-up">
            <p className="page-kicker">Cooperative Bank of Oromia</p>
            <h1 className="page-title mt-5 max-w-3xl text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
              Branch operations, beautifully connected to Head Office.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MaatiiLink brings EOD reports, incidents, HO directives, service
              desk requests, compliance, and audit trails into one secure operating
              cockpit for branch teams and supervisors.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary px-6 py-3 text-sm">
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/api/health" className="btn-secondary px-6 py-3 text-sm">
                <Database className="h-4 w-4" />
                View health
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black text-[var(--primary-dark)]">{value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up reveal-delay-1 float-slow">
            <div className="glass-card relative overflow-hidden rounded-[2rem] p-6">
              <div className="absolute right-6 top-6 rounded-full bg-blue-100 p-3 text-[var(--primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="page-kicker">Live Operations</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Today’s command center
              </h2>
              <div className="mt-6 space-y-3">
                {[
                  ["EOD completion", "84%", "bg-blue-500"],
                  ["Directive acknowledgments", "92%", "bg-slate-950"],
                  ["Critical incidents", "0 open", "bg-emerald-500"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{label}</span>
                      <span className="font-black text-slate-950">{value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${color}`} style={{ width: value === "0 open" ? "100%" : value }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <LockKeyhole className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <p className="font-bold">Secure by default</p>
                    <p className="text-sm text-white/65">
                      Role-based access, signed sessions, and audit coverage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal-up reveal-delay-2 mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="page-kicker">One Platform</p>
              <h2 className="page-title mt-2 text-3xl font-black">Everything branches need</h2>
            </div>
            <span className="rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold text-[var(--primary)] shadow-sm">
              Production-ready workflow suite
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <article
                key={m.title}
                className="polished-card hover-lift rounded-3xl p-6"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-blue-50 p-3 text-[var(--primary)]">
                  <m.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-950">{m.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{m.desc}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
                  Explore module <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="reveal-up reveal-delay-3 mt-16 grid gap-4 lg:grid-cols-3">
          {[
            ["1", "Capture", "Branch staff submit structured reports, incidents, and service requests."],
            ["2", "Coordinate", "Supervisors track exceptions, overdue work, and directive compliance."],
            ["3", "Control", "Head Office keeps users, audit logs, and rollout readiness in view."],
          ].map(([step, title, text]) => (
            <article key={step} className="rounded-3xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-[var(--primary)]">
                {step}
              </span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-[2rem] border border-emerald-200 bg-emerald-50/85 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 font-black text-emerald-950">
              <CheckCircle2 className="h-5 w-5" />
              Local setup is ready
            </h3>
            <Link href="/login" className="text-sm font-bold text-emerald-900 hover:text-[var(--primary)]">
              Sign in with seeded users →
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-emerald-900/80">
            `npm run dev` opens this page, `/api/health` confirms the database, and
            dev users are listed in `docs/DEV_SETUP.md`.
          </p>
        </section>
      </main>
    </div>
  );
}
