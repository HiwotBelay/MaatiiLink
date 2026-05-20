import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth/request";
import { verifySessionToken } from "@/lib/auth/session";
import { validateUserSession } from "@/lib/auth/session-manager";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
import { assertBranchAccess, BranchAccessError } from "@/lib/security/branch-access";
import { prisma } from "@/lib/prisma";
import { jsonForbidden, jsonUnauthorized } from "./http";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
  sessionId: string;
};

export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
  const token = request.cookies.get("maatiilink_session")?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const validated = await validateUserSession(token, payload);
  if (!validated) return null;

  const user = await prisma.user.findUnique({
    where: { id: validated.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      branchId: true,
      isActive: true,
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
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    sessionId: validated.sessionId,
  };
}

export async function requireApiUser(
  request: NextRequest,
  permission?: PermissionKey,
) {
  const user = await getApiUser(request);
  if (!user) {
    return { error: jsonUnauthorized("Session expired or invalid") as Response, user: null };
  }
  if (permission && !hasPermission(user.role, permission)) {
    return { error: jsonForbidden() as Response, user: null };
  }
  return { error: null, user };
}

export async function requireBranchResourceAccess(
  user: ApiUser,
  resourceBranchId: string,
): Promise<Response | null> {
  try {
    assertBranchAccess(user, resourceBranchId);
    return null;
  } catch (e) {
    if (e instanceof BranchAccessError) {
      return jsonForbidden(e.message) as Response;
    }
    throw e;
  }
}
