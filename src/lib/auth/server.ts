import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken, type SessionPayload } from "./session";
import { validateUserSession } from "./session-manager";

export type AuthUser = SessionPayload & {
  isActive: boolean;
};

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const validated = await validateUserSession(token, payload);
  if (!validated) return null;

  const user = await prisma.user.findUnique({
    where: { id: validated.sub },
    select: {
      id: true,
      isActive: true,
      role: true,
      email: true,
      name: true,
      branchId: true,
      lockedUntil: true,
    },
  });

  if (!user || !user.isActive) return null;
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return null;

  const sessionBranch = validated.branchId ?? null;
  const userBranch = user.branchId ?? null;
  if (
    user.role !== validated.role ||
    user.email !== validated.email ||
    sessionBranch !== userBranch
  ) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    sessionId: validated.sessionId,
    isActive: user.isActive,
  };
}

export async function requireServerSession(): Promise<AuthUser> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Redirect when full session validation failed (JWT may still exist).
 * Cookie is cleared in middleware on /login?reason=… — not in Server Components.
 */
export function redirectToLogin(
  reason: "invalid_session" | "session_expired" = "invalid_session",
): never {
  redirect(`/login?reason=${reason}`);
}
