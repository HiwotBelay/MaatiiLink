import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken, type SessionPayload } from "./session";

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
