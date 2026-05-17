"use client";

import { useState } from "react";
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00529b] focus:outline-none focus:ring-1 focus:ring-[#00529b]"
          placeholder="manager@maatiilink.local"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00529b] focus:outline-none focus:ring-1 focus:ring-[#00529b]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#00529b] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
