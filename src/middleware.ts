import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicApiPath } from "@/lib/rbac";

/** UI routes that do not require login (Sprint 1 will add session check). */
const PUBLIC_UI = ["/", "/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }
    // Sprint 1: validate session cookie; return 401 if missing
    return NextResponse.next();
  }

  if (PUBLIC_UI.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Sprint 1: redirect unauthenticated users to /login
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
