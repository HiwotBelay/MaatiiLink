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
  });

  it("branch staff cannot submit EOD", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_SUBMIT)).toBe(false);
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
