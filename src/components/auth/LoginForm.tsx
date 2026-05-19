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
    <form onSubmit={onSubmit} className="auth-form space-y-5">
      {error && (
        <div role="alert" className="auth-error">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="auth-label">
          Work email
        </label>
        <div className="auth-input-wrap">
          <Mail className="auth-input-icon" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="youremail@gmail.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="auth-label">
          Password
        </label>
        <div className="auth-input-wrap">
          <ShieldCheck className="auth-input-icon" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input auth-input-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="auth-input-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary auth-glow-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
