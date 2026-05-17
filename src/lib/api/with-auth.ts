import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth/request";
import { hasPermission, type PermissionKey } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { jsonForbidden, jsonUnauthorized } from "./http";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

export async function getApiUser(request: NextRequest): Promise<ApiUser | null> {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      branchId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  if (user.role !== session.role || user.email !== session.email) return null;

  return user;
}

export async function requireApiUser(
  request: NextRequest,
  permission?: PermissionKey,
) {
  const user = await getApiUser(request);
  if (!user) {
    return { error: jsonUnauthorized() as Response, user: null };
  }
  if (permission && !hasPermission(user.role, permission)) {
    return { error: jsonForbidden() as Response, user: null };
  }
  return { error: null, user };
}
