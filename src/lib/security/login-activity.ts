import { prisma } from "@/lib/prisma";

export type LoginActivityInput = {
  email: string;
  success: boolean;
  userId?: string;
  branchId?: string | null;
  failureReason?: string;
  ipAddress: string;
  userAgent: string;
};

export async function recordLoginActivity(input: LoginActivityInput) {
  return prisma.loginActivity.create({
    data: {
      email: input.email.toLowerCase(),
      success: input.success,
      userId: input.userId,
      branchId: input.branchId ?? undefined,
      failureReason: input.failureReason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export async function listLoginActivityForUser(userId: string, limit = 50) {
  return prisma.loginActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listLoginActivityForAdmin(limit = 100) {
  return prisma.loginActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}
