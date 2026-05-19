import type { Role } from "@prisma/client";

export function roleDisplayName(role: Role): string {
  switch (role) {
    case "HO_ADMIN":
      return "Admin";
    case "BRANCH_MANAGER":
      return "Manager";
    case "BRANCH_STAFF":
      return "Staff";
    case "SUPERVISOR":
      return "Supervisor";
    case "AUDITOR":
      return "Auditor";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function roleSubtitle(role: Role): string {
  switch (role) {
    case "HO_ADMIN":
      return "System Administrator";
    case "BRANCH_MANAGER":
      return "Branch Manager";
    case "BRANCH_STAFF":
      return "Branch Operations";
    case "SUPERVISOR":
      return "District / Regional Supervisor";
    case "AUDITOR":
      return "Internal Audit";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
