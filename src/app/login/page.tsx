import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthGlowCard, AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginAlerts } from "@/components/auth/LoginAlerts";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageShell badge="">
      <AuthGlowCard>
        <div className="auth-card-icon">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="auth-card-title">Sign in</h1>
        <p className="auth-card-subtitle">
          Cooperative Bank of Oromia · MaatiiLink workspace
        </p>

        <Suspense
          fallback={<p className="mt-6 text-sm text-[var(--muted-foreground)]">Loading…</p>}
        >
          <div className="mt-7">
            <LoginAlerts />
            <LoginForm />
          </div>
        </Suspense>

        <div className="auth-card-divider" />

        <p className="auth-card-footer">
          <ShieldCheck className="inline h-4 w-4 text-[var(--primary)]" />{" "}
          No account?{" "}
          <Link href="/signup" className="auth-link">
            Request access
            <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </p>
      </AuthGlowCard>
    </AuthPageShell>
  );
}
