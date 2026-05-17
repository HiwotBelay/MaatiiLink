import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  role: z.nativeEnum(Role),
  branchId: z.string().cuid().optional().nullable(),
});

const createBranchSchema = z.object({
  branchCode: z.string().min(2).max(20).regex(/^[A-Z0-9]+$/),
  name: z.string().min(2).max(200),
  district: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  isSmartBranch: z.boolean().optional(),
  isPilotBranch: z.boolean().optional(),
});

const patchUserSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(120).optional(),
});

export async function createAdminUser(
  actorId: string,
  body: unknown,
) {
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const data = parsed.data;
  if (
    ["BRANCH_STAFF", "BRANCH_MANAGER"].includes(data.role) &&
    !data.branchId
  ) {
    return {
      ok: false as const,
      error: "branchId is required for branch roles",
    };
  }

  if (data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });
    if (!branch) {
      return { ok: false as const, error: "Branch not found" };
    }
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    return { ok: false as const, error: "Email already registered" };
  }

  const passwordHash = await hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      branchId: data.branchId ?? null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      isActive: true,
    },
  });

  await writeAuditLog({
    userId: actorId,
    action: "ADMIN_USER_CREATE",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return { ok: true as const, user };
}

export async function createAdminBranch(actorId: string, body: unknown) {
  const parsed = createBranchSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const data = parsed.data;
  const existing = await prisma.branch.findUnique({
    where: { branchCode: data.branchCode },
  });
  if (existing) {
    return { ok: false as const, error: "Branch code already exists" };
  }

  const branch = await prisma.branch.create({
    data: {
      branchCode: data.branchCode,
      name: data.name,
      district: data.district,
      region: data.region,
      isSmartBranch: data.isSmartBranch ?? false,
      isPilotBranch: data.isPilotBranch ?? false,
    },
  });

  await writeAuditLog({
    userId: actorId,
    action: "ADMIN_BRANCH_CREATE",
    entityType: "Branch",
    entityId: branch.id,
    metadata: { branchCode: branch.branchCode },
  });

  return { ok: true as const, branch };
}

export async function patchAdminUser(
  actorId: string,
  userId: string,
  body: unknown,
) {
  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { ok: false as const, error: "User not found" };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await writeAuditLog({
    userId: actorId,
    action: "ADMIN_USER_UPDATE",
    entityType: "User",
    entityId: user.id,
    metadata: parsed.data,
  });

  return { ok: true as const, user };
}

export async function graduateBranchFromPilot(actorId: string, branchId: string) {
  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: { isPilotBranch: false },
  });

  await writeAuditLog({
    userId: actorId,
    action: "BRANCH_GRADUATE_PILOT",
    entityType: "Branch",
    entityId: branch.id,
    metadata: { branchCode: branch.branchCode },
  });

  return branch;
}
