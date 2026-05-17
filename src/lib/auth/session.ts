import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "./constants";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    branchId: payload.branchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;

    const email = payload.email;
    const name = payload.name;
    const role = payload.role;
    const branchId = payload.branchId;

    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }

    return {
      sub,
      email,
      name,
      role: role as Role,
      branchId: branchId === null || branchId === undefined ? null : String(branchId),
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
