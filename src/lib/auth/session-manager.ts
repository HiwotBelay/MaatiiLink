import { createHash, randomBytes } from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_IDLE_TIMEOUT_SEC,
  SESSION_MAX_AGE_SEC,
} from "./constants";
import { createSessionToken, type SessionPayload } from "./session";

export type SessionCreateInput = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  ipAddress: string;
  userAgent: string;
  deviceLabel: string;
};

export type ValidatedSession = SessionPayload & {
  sessionDbId: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(
  input: SessionCreateInput,
): Promise<{ token: string; sessionId: string }> {
  const sessionId = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  const token = await createSessionToken({
    sub: input.userId,
    email: input.email,
    name: input.name,
    role: input.role,
    branchId: input.branchId,
    sessionId,
  });

  await prisma.userSession.create({
    data: {
      id: sessionId,
      userId: input.userId,
      tokenHash: hashToken(token),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
      expiresAt,
    },
  });

  return { token, sessionId };
}

export async function validateUserSession(
  token: string,
  payload: SessionPayload,
): Promise<ValidatedSession | null> {
  if (!payload.sessionId) return null;

  const session = await prisma.userSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!session || session.userId !== payload.sub) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  const idleMs = SESSION_IDLE_TIMEOUT_SEC * 1000;
  if (Date.now() - session.lastActivityAt.getTime() > idleMs) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  const tokenHash = hashToken(token);
  if (session.tokenHash !== tokenHash) return null;

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return { ...payload, sessionDbId: session.id };
}

export async function touchUserSession(sessionId: string): Promise<boolean> {
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return false;
  }

  const idleMs = SESSION_IDLE_TIMEOUT_SEC * 1000;
  if (Date.now() - session.lastActivityAt.getTime() > idleMs) {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return false;
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });
  return true;
}

export async function revokeUserSession(sessionId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeUserSessionByToken(token: string, sessionId: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.userSession.updateMany({
    where: { id: sessionId, tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
