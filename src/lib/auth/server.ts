import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken, type SessionPayload } from "./session";

export type AuthUser = SessionPayload & {
  isActive: boolean;
};

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, isActive: true, role: true, email: true, name: true, branchId: true },
  });

  if (!user || !user.isActive) return null;

  if (
    user.role !== session.role ||
    user.email !== session.email ||
    user.branchId !== session.branchId
  ) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
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
