import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/request";
import { jsonOk, jsonUnauthorized } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return jsonUnauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      branch: { select: { id: true, name: true, branchCode: true } },
    },
  });

  if (!user || !user.isActive) {
    return jsonUnauthorized();
  }

  return jsonOk({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
    },
  });
}
