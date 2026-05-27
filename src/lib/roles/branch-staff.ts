import type { Role } from "@prisma/client";
import { hasPermission, Permission } from "@/lib/rbac";

export function isBranchStaff(role: Role): boolean {
  return role === "BRANCH_STAFF";
}

export function isBranchManager(role: Role): boolean {
  return role === "BRANCH_MANAGER";
}

/** Branch-facing roles that land on /dashboard */
export function isBranchDashboardRole(role: Role): boolean {
  return isBranchStaff(role) || isBranchManager(role);
}

export type BranchStaffCapabilities = {
  canEditEod: boolean;
  canSubmitEod: boolean;
  canAckDirectives: boolean;
  canUpdateIncidents: boolean;
  canAssignTickets: boolean;
  canCreateIncident: boolean;
  canCreateTicket: boolean;
};

export function getBranchCapabilities(role: Role): BranchStaffCapabilities {
  return {
    canEditEod: hasPermission(role, Permission.EOD_DRAFT),
    canSubmitEod: hasPermission(role, Permission.EOD_SUBMIT),
    canAckDirectives: hasPermission(role, Permission.DIRECTIVE_ACK),
    canUpdateIncidents: hasPermission(role, Permission.INCIDENT_UPDATE),
    canAssignTickets: hasPermission(role, Permission.TICKET_ASSIGN),
    canCreateIncident: hasPermission(role, Permission.INCIDENT_CREATE),
    canCreateTicket: hasPermission(role, Permission.TICKET_CREATE),
  };
}
