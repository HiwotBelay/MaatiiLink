import type { Role } from "@prisma/client";

export function roleDisplayName(role: Role): string {
  switch (role) {
    case "BRANCH_STAFF":
      return "Branch Staff";
    case "BRANCH_MANAGER":
      return "Branch Manager";
    case "REGIONAL_SUPERVISOR":
      return "Regional Supervisor";
    case "HO_OPERATIONS":
      return "HO Operations";
    case "COMPLIANCE_OFFICER":
      return "Compliance Officer";
    case "IT_SUPPORT":
      return "IT Support";
    case "AUDITOR_READ_ONLY":
      return "Auditor";
    case "SUPER_ADMIN":
      return "Super Admin";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function roleSubtitle(role: Role): string {
  switch (role) {
    case "BRANCH_STAFF":
      return "Branch Operations";
    case "BRANCH_MANAGER":
      return "Branch Manager";
    case "REGIONAL_SUPERVISOR":
      return "Regional / District Supervisor";
    case "HO_OPERATIONS":
      return "Head Office Operations";
    case "COMPLIANCE_OFFICER":
      return "Compliance & Risk";
    case "IT_SUPPORT":
      return "Technology Operations";
    case "AUDITOR_READ_ONLY":
      return "Internal Audit (Read-only)";
    case "SUPER_ADMIN":
      return "Platform Administration";
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
