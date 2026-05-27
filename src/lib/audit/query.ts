import { prisma } from "@/lib/prisma";

export async function queryAuditLogs(options?: {
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const limit = Math.min(options?.limit ?? 500, 2000);
  return prisma.auditLog.findMany({
    where: {
      ...(options?.from || options?.to
        ? {
            createdAt: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });
}

export function auditLogsToCsv(
  logs: Awaited<ReturnType<typeof queryAuditLogs>>,
): string {
  const header =
    "id,timestamp,userEmail,userRole,module,action,entityType,entityId,branchId,previousValue,newValue,metadata";
  const rows = logs.map((l) => {
    const meta = l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : "";
    const prev = l.previousValue
      ? JSON.stringify(l.previousValue).replace(/"/g, '""')
      : "";
    const next = l.newValue ? JSON.stringify(l.newValue).replace(/"/g, '""') : "";
    return [
      l.id,
      l.createdAt.toISOString(),
      l.user?.email ?? "",
      l.user?.role ?? "",
      l.module,
      l.action,
      l.entityType,
      l.entityId ?? "",
      l.branchId ?? "",
      `"${prev}"`,
      `"${next}"`,
      `"${meta}"`,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
