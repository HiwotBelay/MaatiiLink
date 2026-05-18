import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";
import {
  defaultRouteForRole,
  hasPermission,
  isPublicApiPath,
  Permission,
} from "@/lib/rbac";
import { isCsrfSafe } from "@/lib/security/csrf";

const PUBLIC_UI = ["/", "/login", "/signup"];

async function getSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  if (!pathname.startsWith("/api") && /\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!isCsrfSafe(request)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request origin" },
        { status: 403 },
      );
    }
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      return NextResponse.redirect(
        new URL(defaultRouteForRole(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (session) {
      return NextResponse.redirect(
        new URL(defaultRouteForRole(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  const isPublicUi = PUBLIC_UI.some(
    (p) => pathname === p,
  );

  if (!isPublicUi && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (session && pathname.startsWith("/supervisor")) {
    const allowed = ["SUPERVISOR", "HO_ADMIN", "AUDITOR"].includes(session.role);
    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (session && pathname.startsWith("/admin")) {
    if (session.role !== "HO_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (session && pathname.startsWith("/ops")) {
    if (session.role !== "HO_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (session && pathname.startsWith("/audit")) {
    const allowed = ["HO_ADMIN", "AUDITOR", "SUPERVISOR"].includes(session.role);
    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (session && pathname.startsWith("/pilot")) {
    const canPilot =
      hasPermission(session.role, Permission.PILOT_VIEW) ||
      hasPermission(session.role, Permission.PILOT_FEEDBACK_CREATE);
    if (!canPilot) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
