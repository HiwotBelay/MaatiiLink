"use client";

import { useEffect } from "react";
import { SESSION_IDLE_TIMEOUT_SEC } from "@/lib/auth/constants";

const HEARTBEAT_MS = Math.min(5 * 60 * 1000, (SESSION_IDLE_TIMEOUT_SEC / 2) * 1000);

export function SessionHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "same-origin",
        });
        if (res.status === 401 && !cancelled) {
          window.location.assign("/login?reason=session_expired");
        }
      } catch {
        /* network blip — retry on next interval */
      }
    }

    void ping();
    const id = window.setInterval(() => void ping(), HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
