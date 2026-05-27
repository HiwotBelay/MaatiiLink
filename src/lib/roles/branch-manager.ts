import type { Role } from "@prisma/client";
import { getBranchCapabilities, isBranchManager } from "@/lib/roles/branch-staff";

export { isBranchManager };

/** Manager-only capabilities beyond branch staff. */
export type BranchManagerCapabilities = ReturnType<typeof getBranchCapabilities>;

export function getManagerCapabilities(role: Role): BranchManagerCapabilities {
  return getBranchCapabilities(role);
}

export function isBranchManagerRole(role: Role): boolean {
  return isBranchManager(role);
}
