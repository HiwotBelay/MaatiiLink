import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";

const accessSteps = [
  {
    title: "Confirm branch identity",
    text: "Your supervisor or HO Admin verifies your role and assigned branch.",
    icon: Building2,
  },
  {
    title: "Provision securely",
    text: "HO Admin creates your account from the Admin console with the correct RBAC role.",
    icon: ShieldCheck,
  },
  {
    title: "Start operating",
    text: "Sign in and land on the dashboard your role is allowed to use.",
    icon: ClipboardList,
  },
];

export default function SignupPage() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden px-4 py-6">
      <div className="hero-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[var(--primary)]">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
        <Link href="/login" className="btn-primary px-4 py-2 text-sm">
          Sign in
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="reveal-up">
          <div className="glass-card rounded-[2rem] p-8">
            <p className="page-kicker">Request Access</p>
            <div className="mt-4">
              <MaatiiLinkLogo height={46} priority />
            </div>
            <h1 className="page-title mt-8 text-4xl font-black leading-tight sm:text-5xl">
              Secure signup for an internal operations platform.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-600">
              MaatiiLink does not allow public self-registration because accounts
              control branch operations and audited banking workflows. Ask your
              HO Admin to create your account from the Admin console.
            </p>

            <div className="mt-8 rounded-3xl bg-slate-950 p-5 text-white">
              <p className="flex items-center gap-2 font-black">
                <CheckCircle2 className="h-5 w-5 text-blue-200" />
                Local demo access
              </p>
              <p className="mt-2 text-sm leading-6 text-white/68">
                For this development setup, use the seeded accounts in
                `docs/DEV_SETUP.md`. Password: `ChangeMe123!`.
              </p>
              <Link href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white">
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="reveal-up reveal-delay-1 space-y-4">
          {accessSteps.map((step, index) => (
            <article key={step.title} className="polished-card hover-lift rounded-3xl p-6">
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[var(--primary)]">
                  <step.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              </div>
            </article>
          ))}

          <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-6">
            <p className="flex items-center gap-2 font-black text-[var(--primary-dark)]">
              <Mail className="h-5 w-5 text-[var(--primary)]" />
              What to send your admin
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Full name and work email</li>
              <li>Branch code or HO department</li>
              <li>Required role: Branch Staff, Branch Manager, Supervisor, Auditor, or HO Admin</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
