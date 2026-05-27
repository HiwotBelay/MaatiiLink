import type { Role } from "@prisma/client";
import { hasPermission, Permission } from "@/lib/rbac";

const BRANCH_BOUND_ROLES: Role[] = ["BRANCH_STAFF", "BRANCH_MANAGER"];

export function roleRequiresBranch(role: Role): boolean {
  return BRANCH_BOUND_ROLES.includes(role);
}

export function canAccessAllBranches(role: Role): boolean {
  return (
    hasPermission(role, Permission.EOD_VIEW_ALL) ||
    hasPermission(role, Permission.INCIDENT_VIEW_ALL) ||
    hasPermission(role, Permission.TICKET_VIEW_ALL)
  );
}

/** Enforce branch isolation for branch-scoped roles. */
export function assertBranchAccess(
  user: { role: Role; branchId: string | null },
  resourceBranchId: string,
): void {
  if (canAccessAllBranches(user.role)) return;
  if (!user.branchId || user.branchId !== resourceBranchId) {
    throw new BranchAccessError("Access denied for this branch");
  }
}

export function resolveBranchScope(
  user: { role: Role; branchId: string | null },
  requestedBranchId?: string | null,
): string | undefined {
  if (canAccessAllBranches(user.role)) {
    return requestedBranchId ?? undefined;
  }
  if (!user.branchId) {
    throw new BranchAccessError("User is not assigned to a branch");
  }
  if (requestedBranchId && requestedBranchId !== user.branchId) {
    throw new BranchAccessError("Access denied for this branch");
  }
  return user.branchId;
}

export class BranchAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchAccessError";
  }
}
