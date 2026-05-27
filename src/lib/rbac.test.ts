import { describe, expect, it } from "vitest";
import {
  hasPermission,
  Permission,
  defaultRouteForRole,
  isPublicApiPath,
  getApiRoutePermission,
} from "./rbac";

describe("rbac", () => {
  it("branch manager can submit EOD", () => {
    expect(hasPermission("BRANCH_MANAGER", Permission.EOD_SUBMIT)).toBe(true);
    expect(hasPermission("BRANCH_MANAGER", Permission.EOD_DRAFT)).toBe(true);
    expect(hasPermission("BRANCH_MANAGER", Permission.DIRECTIVE_ACK)).toBe(true);
    expect(hasPermission("BRANCH_MANAGER", Permission.INCIDENT_UPDATE)).toBe(true);
    expect(hasPermission("BRANCH_MANAGER", Permission.TICKET_ASSIGN)).toBe(false);
    expect(hasPermission("BRANCH_MANAGER", Permission.PILOT_VIEW)).toBe(false);
  });

  it("branch manager differs from staff on accountable actions", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_DRAFT)).toBe(false);
    expect(hasPermission("BRANCH_MANAGER", Permission.EOD_DRAFT)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.DIRECTIVE_ACK)).toBe(false);
    expect(hasPermission("BRANCH_MANAGER", Permission.DIRECTIVE_ACK)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.INCIDENT_UPDATE)).toBe(false);
    expect(hasPermission("BRANCH_MANAGER", Permission.INCIDENT_UPDATE)).toBe(true);
  });

  it("branch staff cannot submit EOD", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_SUBMIT)).toBe(false);
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_DRAFT)).toBe(false);
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_VIEW_BRANCH)).toBe(true);
  });

  it("branch staff incident and knowledge permissions", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.INCIDENT_CREATE)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.INCIDENT_UPDATE)).toBe(false);
    expect(hasPermission("BRANCH_STAFF", Permission.DIRECTIVE_ACK)).toBe(false);
    expect(hasPermission("BRANCH_STAFF", Permission.DIRECTIVE_VIEW)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.TICKET_CREATE)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.TICKET_ASSIGN)).toBe(false);
    expect(hasPermission("BRANCH_STAFF", Permission.PILOT_FEEDBACK_CREATE)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.PILOT_VIEW)).toBe(false);
  });

  it("EOD POST requires draft permission in API map", () => {
    expect(getApiRoutePermission("/api/eod", "POST")).toBe(Permission.EOD_DRAFT);
    expect(getApiRoutePermission("/api/eod", "GET")).toBe(Permission.EOD_VIEW_BRANCH);
    expect(getApiRoutePermission("/api/eod/abc-123", "GET")).toBe(
      Permission.EOD_VIEW_BRANCH,
    );
  });

  it("staff can upload incident evidence via create permission", () => {
    expect(
      getApiRoutePermission("/api/incidents/inc-1/attachments", "POST"),
    ).toBe(Permission.INCIDENT_CREATE);
    expect(getApiRoutePermission("/api/incidents/inc-1", "PATCH")).toBe(
      Permission.INCIDENT_UPDATE,
    );
  });

  it("HO operations can publish directives", () => {
    expect(hasPermission("HO_OPERATIONS", Permission.DIRECTIVE_PUBLISH)).toBe(true);
    expect(hasPermission("REGIONAL_SUPERVISOR", Permission.DIRECTIVE_PUBLISH)).toBe(
      false,
    );
  });

  it("auditor is read-only for incidents", () => {
    expect(hasPermission("AUDITOR_READ_ONLY", Permission.INCIDENT_CREATE)).toBe(false);
    expect(hasPermission("AUDITOR_READ_ONLY", Permission.AUDIT_EXPORT)).toBe(true);
  });

  it("super admin has admin users permission", () => {
    expect(hasPermission("SUPER_ADMIN", Permission.ADMIN_USERS)).toBe(true);
    expect(hasPermission("HO_OPERATIONS", Permission.ADMIN_USERS)).toBe(false);
  });

  it("default routes by role", () => {
    expect(defaultRouteForRole("BRANCH_MANAGER")).toBe("/dashboard");
    expect(defaultRouteForRole("REGIONAL_SUPERVISOR")).toBe("/supervisor");
    expect(defaultRouteForRole("HO_OPERATIONS")).toBe("/ho");
    expect(defaultRouteForRole("SUPER_ADMIN")).toBe("/admin");
    expect(defaultRouteForRole("IT_SUPPORT")).toBe("/ops");
  });

  it("public API paths", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/auth/login")).toBe(true);
    expect(isPublicApiPath("/api/eod")).toBe(false);
  });

  it("API route permissions", () => {
    expect(getApiRoutePermission("/api/auth/me", "GET")).toBe("SESSION_ONLY");
    expect(getApiRoutePermission("/api/admin/users", "GET")).toBe(
      Permission.ADMIN_USERS,
    );
  });

  it("IT support can assign tickets", () => {
    expect(hasPermission("IT_SUPPORT", Permission.TICKET_ASSIGN)).toBe(true);
  });

  it("compliance officer can export audit", () => {
    expect(hasPermission("COMPLIANCE_OFFICER", Permission.AUDIT_EXPORT)).toBe(true);
  });
});
