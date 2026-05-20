import { NextRequest } from "next/server";
import { AuditModule, writeAuditLog } from "@/lib/audit";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getSessionFromRequest } from "@/lib/auth/request";
import { sessionCookieOptions } from "@/lib/auth/session";
import { revokeUserSessionByToken } from "@/lib/auth/session-manager";
import { jsonOk } from "@/lib/api/http";
import { getRequestSecurityContext } from "@/lib/security/request-context";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const ctx = getRequestSecurityContext(request);
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (session && token) {
    await revokeUserSessionByToken(token, session.sessionId);
    await writeAuditLog({
      userId: session.sub,
      action: "LOGOUT",
      module: AuditModule.AUTH,
      entityType: "User",
      entityId: session.sub,
      branchId: session.branchId,
      request: ctx,
    });
  }

  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
