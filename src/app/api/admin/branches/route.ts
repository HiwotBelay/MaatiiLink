import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import { createAdminBranch } from "@/lib/admin/provision";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.ADMIN_USERS);
  if (error || !user) return error!;

  const branches = await prisma.branch.findMany({
    orderBy: { branchCode: "asc" },
    select: {
      id: true,
      branchCode: true,
      name: true,
      district: true,
      region: true,
      isSmartBranch: true,
      isPilotBranch: true,
    },
  });

  return jsonOk({ ok: true, branches });
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

  const result = await createAdminBranch(user.id, body);
  if (!result.ok) {
    if (typeof result.error === "string") {
      return jsonError(result.error, 400);
    }
    return jsonValidation(result.error);
  }

  return jsonOk({ ok: true, branch: result.branch }, 201);
}
