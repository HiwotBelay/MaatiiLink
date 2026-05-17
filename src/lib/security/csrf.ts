import type { NextRequest } from "next/server";

/** Reject cross-site POST/PATCH/DELETE when Origin/Host do not match (Phase 4). */
export function isCsrfSafe(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const allowed = new Set([
    `http://${host}`,
    `https://${host}`,
    process.env.APP_URL?.replace(/\/$/, ""),
  ].filter(Boolean) as string[]);

  if (origin) {
    return allowed.has(origin);
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      return allowed.has(refOrigin);
    } catch {
      return false;
    }
  }

  // Non-browser clients (no Origin) — allow for health checks only on public routes
  return false;
}
