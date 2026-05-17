import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { createAdminUser } from "@/lib/admin/provision";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.ADMIN_USERS);
  if (error || !user) return error!;

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      branch: { select: { name: true, branchCode: true } },
      createdAt: true,
    },
  });

  return jsonOk({
    ok: true,
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.ADMIN_USERS);
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const result = await createAdminUser(user.id, body);
  if (!result.ok) {
    if (typeof result.error === "string") {
      return jsonError(result.error, 400);
    }
    return jsonValidation(result.error);
  }

  return jsonOk({ ok: true, user: result.user }, 201);
}
