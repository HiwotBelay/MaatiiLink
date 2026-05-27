import { NextRequest } from "next/server";
import { getApiUser } from "@/lib/api/with-auth";
import { jsonOk, jsonUnauthorized } from "@/lib/api/http";
import { SESSION_IDLE_TIMEOUT_SEC } from "@/lib/auth/constants";

/** Session heartbeat — extends idle timeout from the client. */
export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return jsonUnauthorized("Session expired due to inactivity");
  }

  return jsonOk({
    ok: true,
    idleTimeoutSec: SESSION_IDLE_TIMEOUT_SEC,
    sessionId: user.sessionId,
  });
}
