"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; redirectTo?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(
          res.ok
            ? "Unexpected server response."
            : `Server error (${res.status}). Check Vercel env: SESSION_SECRET (32+ chars) and DATABASE_URL.`,
        );
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      // Prefer server role-based route (avoids stale ?next= trapping users on /login)
      const dest = data.redirectTo ?? "/dashboard";

      window.location.assign(dest);
      return;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
          Work email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-control pl-10"
            placeholder="manager@maatiilink.local"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
          Password
        </label>
        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-control px-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--primary)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in
          </>
        ) : (
          <>
            Sign in securely
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
