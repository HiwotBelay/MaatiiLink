import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permission } from "@/lib/rbac";
import { ACTIVE_STATUSES, DEPARTMENT_LABELS } from "./constants";
import { buildTicketWhere } from "./search";

export async function getTicketAnalytics(user: {
  role: Role;
  branchId: string | null;
}) {
  const canViewAll = hasPermission(user.role, Permission.TICKET_VIEW_ALL);
  const baseWhere = buildTicketWhere(
    {},
    canViewAll ? undefined : user.branchId ?? "__none__",
  );
  const now = new Date();

  const activeWhere = {
    AND: [baseWhere, { status: { in: [...ACTIVE_STATUSES] } }],
  };

  const [overdue, breached, tickets, branches] = await Promise.all([
    prisma.serviceTicket.count({
      where: {
        AND: [
          activeWhere,
          { slaResolutionDueAt: { lt: now } },
        ],
      },
    }),
    prisma.serviceTicket.count({
      where: { AND: [baseWhere, { slaBreachedAt: { not: null } }] },
    }),
    prisma.serviceTicket.findMany({
      where: activeWhere,
      select: {
        assigneeId: true,
        category: true,
        branchId: true,
        priority: true,
      },
    }),
    prisma.branch.findMany({
      select: { id: true, branchCode: true, name: true, region: true },
    }),
  ]);

  const workloadMap = new Map<
    string,
    { assigneeId: string | null; name: string; count: number }
  >();
  workloadMap.set("__unassigned__", {
    assigneeId: null,
    name: "Unassigned queue",
    count: 0,
  });

  const branchHeat = new Map<string, number>();
  const deptQueue = new Map<string, number>();

  for (const t of tickets) {
    const key = t.assigneeId ?? "__unassigned__";
    const row = workloadMap.get(key) ?? {
      assigneeId: t.assigneeId,
      name: t.assigneeId ? "Assigned" : "Unassigned queue",
      count: 0,
    };
    row.count += 1;
    workloadMap.set(key, row);

    branchHeat.set(t.branchId, (branchHeat.get(t.branchId) ?? 0) + 1);
    deptQueue.set(t.category, (deptQueue.get(t.category) ?? 0) + 1);
  }

  const assigneeIds = [...workloadMap.keys()].filter((k) => k !== "__unassigned__");
  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(assignees.map((a) => [a.id, a.name]));

  const teamWorkload = [...workloadMap.entries()].map(([key, row]) => ({
    assigneeId: row.assigneeId,
    assigneeName:
      key === "__unassigned__"
        ? "Unassigned queue"
        : (nameById.get(key) ?? "Unknown"),
    openCount: row.count,
  }));

  const branchHeatmap = branches
    .map((b) => ({
      branchId: b.id,
      branchCode: b.branchCode,
      name: b.name,
      region: b.region,
      openTickets: branchHeat.get(b.id) ?? 0,
    }))
    .filter((b) => b.openTickets > 0)
    .sort((a, b) => b.openTickets - a.openTickets)
    .slice(0, 12);

  const departmentQueues = [...deptQueue.entries()].map(([cat, count]) => ({
    category: cat,
    label: DEPARTMENT_LABELS[cat as keyof typeof DEPARTMENT_LABELS] ?? cat,
    openCount: count,
  }));

  return {
    overdueTickets: overdue,
    slaBreaches: breached,
    activeTickets: tickets.length,
    teamWorkload,
    branchHeatmap,
    departmentQueues,
  };
}
