"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  invalid_session:
    "Your session could not be verified. Sign in again (this can happen after an app update or idle timeout).",
  session_expired: "Your session expired. Please sign in again.",
};

export function LoginAlerts() {
  const params = useSearchParams();
  const reason = params.get("reason");
  if (!reason) return null;

  const text = MESSAGES[reason] ?? "Please sign in again.";
  return (
    <div role="status" className="auth-error mb-4 border-amber-500/40 bg-amber-500/10 text-amber-100">
      {text}
    </div>
  );
}
