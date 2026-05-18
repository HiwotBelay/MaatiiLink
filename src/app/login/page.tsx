import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, LockKeyhole, RadioTower } from "lucide-react";
import { MaatiiLinkLogo } from "@/components/brand/MaatiiLinkLogo";
import { LoginForm } from "@/components/auth/LoginForm";

const loginHighlights = [
  {
    title: "Branch aware",
    text: "Users land on the right workflow for their role.",
    icon: Building2,
  },
  {
    title: "Session protected",
    text: "Signed HTTP-only sessions keep accounts safe.",
    icon: LockKeyhole,
  },
  {
    title: "Live status",
    text: "Health and compliance visibility for supervisors.",
    icon: RadioTower,
  },
];

export default function LoginPage() {
  return (
    <div className="app-bg relative min-h-screen overflow-hidden px-4 py-6">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[var(--primary)]">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
        <Link href="/signup" className="btn-secondary px-4 py-2 text-sm">
          Request access
        </Link>
      </div>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr]">
        <section className="reveal-up hidden lg:block">
          <p className="page-kicker">Secure Branch Workspace</p>
          <h1 className="page-title mt-4 text-5xl font-black leading-tight">
            Sign in to coordinate today’s operations.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Access role-based dashboards for EOD reporting, incidents, directives,
            service desk, pilot readiness, and audit controls.
          </p>
          <div className="mt-8 grid max-w-xl gap-3">
            {loginHighlights.map((item) => (
              <div key={item.title} className="glass-card hover-lift rounded-3xl p-5">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-[var(--primary)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal-up reveal-delay-1">
          <div className="glass-card mx-auto w-full max-w-md rounded-[2rem] p-8">
            <div className="mb-7">
              <p className="page-kicker">Cooperative Bank of Oromia</p>
              <div className="mt-3">
                <MaatiiLinkLogo height={44} priority />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in with your MaatiiLink account. For local development, use
                the seeded users from `docs/DEV_SETUP.md`.
              </p>
            </div>
            <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
              <LoginForm />
            </Suspense>
            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
              <p className="flex items-center gap-2 font-bold text-[var(--primary-dark)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                Need an account?
              </p>
              <p className="mt-1">
                Internal users are created by HO Admin.{" "}
                <Link href="/signup" className="font-bold text-[var(--primary)] hover:underline">
                  Request access
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
