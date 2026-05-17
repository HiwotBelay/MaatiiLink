import type { Role } from "@prisma/client";

/** Canonical permissions — enforced in API routes and server actions (Sprint 1+). */
export const Permission = {
  EOD_DRAFT: "eod:draft",
  EOD_SUBMIT: "eod:submit",
  EOD_LOCK: "eod:lock",
  EOD_VIEW_BRANCH: "eod:view:branch",
  EOD_VIEW_ALL: "eod:view:all",
  INCIDENT_CREATE: "incident:create",
  INCIDENT_UPDATE: "incident:update",
  INCIDENT_VIEW_BRANCH: "incident:view:branch",
  INCIDENT_VIEW_ALL: "incident:view:all",
  DIRECTIVE_PUBLISH: "directive:publish",
  DIRECTIVE_ACK: "directive:ack",
  DIRECTIVE_VIEW: "directive:view",
  TICKET_CREATE: "ticket:create",
  TICKET_ASSIGN: "ticket:assign",
  TICKET_VIEW_BRANCH: "ticket:view:branch",
  TICKET_VIEW_ALL: "ticket:view:all",
  DASHBOARD_SUPERVISOR: "dashboard:supervisor",
  ADMIN_USERS: "admin:users",
  AUDIT_EXPORT: "audit:export",
  AUDIT_VIEW: "audit:view",
  PILOT_VIEW: "pilot:view",
  PILOT_FEEDBACK_CREATE: "pilot:feedback:create",
  PILOT_FEEDBACK_TRIAGE: "pilot:feedback:triage",
  OPS_VIEW: "ops:view",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<PermissionKey>> = {
  BRANCH_STAFF: new Set([
    Permission.EOD_VIEW_BRANCH,
    Permission.INCIDENT_CREATE,
    Permission.INCIDENT_VIEW_BRANCH,
    Permission.DIRECTIVE_VIEW,
    Permission.TICKET_CREATE,
    Permission.TICKET_VIEW_BRANCH,
    Permission.PILOT_FEEDBACK_CREATE,
  ]),
  BRANCH_MANAGER: new Set([
    Permission.EOD_DRAFT,
    Permission.EOD_SUBMIT,
    Permission.EOD_VIEW_BRANCH,
    Permission.INCIDENT_CREATE,
    Permission.INCIDENT_UPDATE,
    Permission.INCIDENT_VIEW_BRANCH,
    Permission.DIRECTIVE_VIEW,
    Permission.DIRECTIVE_ACK,
    Permission.TICKET_CREATE,
    Permission.TICKET_VIEW_BRANCH,
    Permission.PILOT_FEEDBACK_CREATE,
  ]),
  SUPERVISOR: new Set([
    Permission.EOD_LOCK,
    Permission.EOD_VIEW_ALL,
    Permission.INCIDENT_CREATE,
    Permission.INCIDENT_UPDATE,
    Permission.INCIDENT_VIEW_ALL,
    Permission.DIRECTIVE_VIEW,
    Permission.TICKET_CREATE,
    Permission.TICKET_VIEW_ALL,
    Permission.DASHBOARD_SUPERVISOR,
    Permission.AUDIT_VIEW,
    Permission.PILOT_VIEW,
    Permission.PILOT_FEEDBACK_CREATE,
  ]),
  HO_ADMIN: new Set([
    Permission.EOD_DRAFT,
    Permission.EOD_SUBMIT,
    Permission.EOD_LOCK,
    Permission.EOD_VIEW_ALL,
    Permission.INCIDENT_CREATE,
    Permission.INCIDENT_UPDATE,
    Permission.INCIDENT_VIEW_ALL,
    Permission.DIRECTIVE_PUBLISH,
    Permission.DIRECTIVE_VIEW,
    Permission.DIRECTIVE_ACK,
    Permission.TICKET_CREATE,
    Permission.TICKET_ASSIGN,
    Permission.TICKET_VIEW_ALL,
    Permission.DASHBOARD_SUPERVISOR,
    Permission.ADMIN_USERS,
    Permission.AUDIT_EXPORT,
    Permission.AUDIT_VIEW,
    Permission.PILOT_VIEW,
    Permission.PILOT_FEEDBACK_TRIAGE,
    Permission.PILOT_FEEDBACK_CREATE,
    Permission.OPS_VIEW,
  ]),
  AUDITOR: new Set([
    Permission.EOD_VIEW_ALL,
    Permission.INCIDENT_VIEW_ALL,
    Permission.DIRECTIVE_VIEW,
    Permission.TICKET_VIEW_ALL,
    Permission.DASHBOARD_SUPERVISOR,
    Permission.AUDIT_EXPORT,
    Permission.AUDIT_VIEW,
    Permission.PILOT_VIEW,
  ]),
};

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function requirePermission(role: Role, permission: PermissionKey): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: role ${role} lacks ${permission}`);
  }
}

/** Post-login landing route per role. */
export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case "SUPERVISOR":
    case "HO_ADMIN":
    case "AUDITOR":
      return "/supervisor";
    default:
      return "/dashboard";
  }
}

export const PUBLIC_API_PATHS = ["/api/health", "/api/auth/login"] as const;

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
