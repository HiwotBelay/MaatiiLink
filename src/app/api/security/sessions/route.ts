import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request, Permission.SECURITY_VIEW);
  if (error || !user) return error!;

  const sessions = await prisma.userSession.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceLabel: true,
      lastActivityAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return jsonOk({ ok: true, sessions });
}
