import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { sessionCookieOptions, verifySessionToken } from "@/lib/auth/session";
import {
  canAccessUiRoute,
  defaultRouteForRole,
  isPublicApiPath,
} from "@/lib/rbac";
import { isApiRouteAllowed } from "@/lib/security/route-permissions";
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
    if (!isApiRouteAllowed(session.role, pathname, request.method)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname === "/signup") {
    const reason = request.nextUrl.searchParams.get("reason");
    // Stale JWT: show login and drop cookie (prevents /login ↔ /dashboard loop)
    if (session && reason) {
      const res = NextResponse.next();
      const opts = sessionCookieOptions();
      res.cookies.set(opts.name, "", {
        httpOnly: opts.httpOnly,
        secure: opts.secure,
        sameSite: opts.sameSite,
        path: opts.path,
        maxAge: 0,
      });
      return res;
    }
    if (session && !reason) {
      return NextResponse.redirect(
        new URL(defaultRouteForRole(session.role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  const isPublicUi = PUBLIC_UI.some((p) => pathname === p);

  if (!isPublicUi && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (session && !canAccessUiRoute(session.role, pathname)) {
    return NextResponse.redirect(new URL(defaultRouteForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
