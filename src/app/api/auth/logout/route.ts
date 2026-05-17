import { NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getSessionFromRequest } from "@/lib/auth/request";
import { sessionCookieOptions } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (session) {
    await writeAuditLog({
      userId: session.sub,
      action: "LOGOUT",
      entityType: "User",
      entityId: session.sub,
    });
  }

  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
