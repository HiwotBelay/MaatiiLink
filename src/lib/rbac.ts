import type { Role } from "@prisma/client";

/** Canonical permissions — enforced in middleware and API routes. */
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
  SECURITY_VIEW: "security:view",
  SECURITY_MANAGE: "security:manage",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const BRANCH_OPS: PermissionKey[] = [
  Permission.EOD_VIEW_BRANCH,
  Permission.INCIDENT_CREATE,
  Permission.INCIDENT_VIEW_BRANCH,
  Permission.DIRECTIVE_VIEW,
  Permission.TICKET_CREATE,
  Permission.TICKET_VIEW_BRANCH,
  Permission.PILOT_FEEDBACK_CREATE,
];

const BRANCH_MANAGER_EXTRA: PermissionKey[] = [
  Permission.EOD_DRAFT,
  Permission.EOD_SUBMIT,
  Permission.INCIDENT_UPDATE,
  Permission.DIRECTIVE_ACK,
];

const REGIONAL_SUPERVISOR: PermissionKey[] = [
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
  Permission.SECURITY_VIEW,
];

const HO_OPERATIONS: PermissionKey[] = [
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
  Permission.AUDIT_VIEW,
  Permission.PILOT_VIEW,
  Permission.PILOT_FEEDBACK_TRIAGE,
  Permission.PILOT_FEEDBACK_CREATE,
  Permission.OPS_VIEW,
  Permission.SECURITY_VIEW,
];

const COMPLIANCE_OFFICER: PermissionKey[] = [
  Permission.EOD_VIEW_ALL,
  Permission.INCIDENT_VIEW_ALL,
  Permission.DIRECTIVE_VIEW,
  Permission.TICKET_VIEW_ALL,
  Permission.DASHBOARD_SUPERVISOR,
  Permission.AUDIT_EXPORT,
  Permission.AUDIT_VIEW,
  Permission.PILOT_VIEW,
  Permission.SECURITY_VIEW,
];

const IT_SUPPORT: PermissionKey[] = [
  Permission.TICKET_CREATE,
  Permission.TICKET_ASSIGN,
  Permission.TICKET_VIEW_ALL,
  Permission.INCIDENT_VIEW_ALL,
  Permission.OPS_VIEW,
  Permission.PILOT_FEEDBACK_CREATE,
];

const AUDITOR_READ_ONLY: PermissionKey[] = [
  Permission.EOD_VIEW_ALL,
  Permission.INCIDENT_VIEW_ALL,
  Permission.DIRECTIVE_VIEW,
  Permission.TICKET_VIEW_ALL,
  Permission.DASHBOARD_SUPERVISOR,
  Permission.AUDIT_EXPORT,
  Permission.AUDIT_VIEW,
  Permission.PILOT_VIEW,
  Permission.SECURITY_VIEW,
];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<PermissionKey>> = {
  BRANCH_STAFF: new Set(BRANCH_OPS),
  BRANCH_MANAGER: new Set([...BRANCH_OPS, ...BRANCH_MANAGER_EXTRA]),
  REGIONAL_SUPERVISOR: new Set(REGIONAL_SUPERVISOR),
  HO_OPERATIONS: new Set(HO_OPERATIONS),
  COMPLIANCE_OFFICER: new Set(COMPLIANCE_OFFICER),
  IT_SUPPORT: new Set(IT_SUPPORT),
  AUDITOR_READ_ONLY: new Set(AUDITOR_READ_ONLY),
  SUPER_ADMIN: new Set([
    ...HO_OPERATIONS,
    Permission.ADMIN_USERS,
    Permission.AUDIT_EXPORT,
    Permission.SECURITY_MANAGE,
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
    case "REGIONAL_SUPERVISOR":
    case "HO_OPERATIONS":
    case "COMPLIANCE_OFFICER":
    case "AUDITOR_READ_ONLY":
    case "SUPER_ADMIN":
      return "/supervisor";
    case "IT_SUPPORT":
      return "/ops";
    default:
      return "/dashboard";
  }
}

export const PUBLIC_API_PATHS = [
  "/api/health",
  "/api/auth/login",
] as const;

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type RouteRule = {
  pattern: RegExp;
  methods?: string[];
  permission: PermissionKey;
};

/** API route permission map — enforced in middleware (defense in depth with requireApiUser). */
/** Routes that only require a valid session (no specific permission). */
const SESSION_ONLY_API =
  /^\/api\/(auth\/(me|logout|session|activity)|security\/sessions|notifications(\/|$))/;

const API_ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/api\/eod\/[^/]+\/submit$/, methods: ["POST"], permission: Permission.EOD_SUBMIT },
  { pattern: /^\/api\/eod\/[^/]+\/(lock|review|escalate)$/, methods: ["POST"], permission: Permission.EOD_LOCK },
  { pattern: /^\/api\/eod\/(analytics|alerts)$/, methods: ["GET"], permission: Permission.EOD_VIEW_BRANCH },
  { pattern: /^\/api\/eod/, permission: Permission.EOD_VIEW_BRANCH },
  { pattern: /^\/api\/incidents$/, methods: ["POST"], permission: Permission.INCIDENT_CREATE },
  { pattern: /^\/api\/incidents\/analytics$/, methods: ["GET"], permission: Permission.INCIDENT_VIEW_BRANCH },
  { pattern: /^\/api\/incidents\/[^/]+\/attachments$/, methods: ["POST"], permission: Permission.INCIDENT_UPDATE },
  { pattern: /^\/api\/incidents/, permission: Permission.INCIDENT_VIEW_BRANCH },
  { pattern: /^\/api\/directives$/, methods: ["POST"], permission: Permission.DIRECTIVE_PUBLISH },
  { pattern: /^\/api\/directives\/[^/]+\/acknowledge$/, methods: ["POST"], permission: Permission.DIRECTIVE_ACK },
  { pattern: /^\/api\/directives/, permission: Permission.DIRECTIVE_VIEW },
  { pattern: /^\/api\/tickets$/, methods: ["POST"], permission: Permission.TICKET_CREATE },
  { pattern: /^\/api\/tickets\/queue$/, methods: ["GET"], permission: Permission.TICKET_ASSIGN },
  { pattern: /^\/api\/tickets\/analytics$/, methods: ["GET"], permission: Permission.TICKET_VIEW_BRANCH },
  { pattern: /^\/api\/tickets\/[^/]+\/notes$/, methods: ["POST"], permission: Permission.TICKET_ASSIGN },
  { pattern: /^\/api\/tickets\/[^/]+$/, methods: ["PATCH"], permission: Permission.TICKET_ASSIGN },
  { pattern: /^\/api\/tickets/, permission: Permission.TICKET_VIEW_BRANCH },
  { pattern: /^\/api\/audit/, permission: Permission.AUDIT_VIEW },
  { pattern: /^\/api\/admin/, permission: Permission.ADMIN_USERS },
  { pattern: /^\/api\/supervisor/, permission: Permission.DASHBOARD_SUPERVISOR },
  { pattern: /^\/api\/ops/, permission: Permission.OPS_VIEW },
  { pattern: /^\/api\/pilot\/feedback\/[^/]+$/, methods: ["PATCH"], permission: Permission.PILOT_FEEDBACK_TRIAGE },
  { pattern: /^\/api\/pilot\/feedback$/, methods: ["POST"], permission: Permission.PILOT_FEEDBACK_CREATE },
  { pattern: /^\/api\/pilot/, permission: Permission.PILOT_VIEW },
  { pattern: /^\/api\/security/, permission: Permission.SECURITY_VIEW },
];

export function getApiRoutePermission(
  pathname: string,
  method: string,
): PermissionKey | "SESSION_ONLY" | undefined {
  if (SESSION_ONLY_API.test(pathname)) {
    return "SESSION_ONLY";
  }

  const upperMethod = method.toUpperCase();
  for (const rule of API_ROUTE_RULES) {
    if (!rule.pattern.test(pathname)) continue;
    if (rule.methods && !rule.methods.includes(upperMethod)) continue;
    return rule.permission;
  }

  return undefined;
}

/** UI route access by path prefix. */
export function canAccessUiRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/supervisor")) {
    return hasPermission(role, Permission.DASHBOARD_SUPERVISOR);
  }
  if (pathname.startsWith("/admin")) {
    return hasPermission(role, Permission.ADMIN_USERS);
  }
  if (pathname.startsWith("/ops")) {
    return hasPermission(role, Permission.OPS_VIEW);
  }
  if (pathname.startsWith("/audit")) {
    return hasPermission(role, Permission.AUDIT_VIEW);
  }
  if (pathname.startsWith("/security")) {
    return hasPermission(role, Permission.SECURITY_VIEW);
  }
  if (pathname.startsWith("/pilot")) {
    return (
      hasPermission(role, Permission.PILOT_VIEW) ||
      hasPermission(role, Permission.PILOT_FEEDBACK_CREATE)
    );
  }
  return true;
}

export const ENTERPRISE_ROLES: Role[] = [
  "BRANCH_STAFF",
  "BRANCH_MANAGER",
  "REGIONAL_SUPERVISOR",
  "HO_OPERATIONS",
  "COMPLIANCE_OFFICER",
  "IT_SUPPORT",
  "AUDITOR_READ_ONLY",
  "SUPER_ADMIN",
];
