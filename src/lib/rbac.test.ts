import { describe, expect, it } from "vitest";
import { hasPermission, Permission, defaultRouteForRole, isPublicApiPath } from "./rbac";

describe("rbac", () => {
  it("branch manager can submit EOD", () => {
    expect(hasPermission("BRANCH_MANAGER", Permission.EOD_SUBMIT)).toBe(true);
  });

  it("branch staff cannot submit EOD", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.EOD_SUBMIT)).toBe(false);
  });

  it("only HO admin can publish directives", () => {
    expect(hasPermission("HO_ADMIN", Permission.DIRECTIVE_PUBLISH)).toBe(true);
    expect(hasPermission("SUPERVISOR", Permission.DIRECTIVE_PUBLISH)).toBe(false);
  });

  it("auditor is read-only for incidents", () => {
    expect(hasPermission("AUDITOR", Permission.INCIDENT_CREATE)).toBe(false);
    expect(hasPermission("AUDITOR", Permission.AUDIT_EXPORT)).toBe(true);
  });

  it("default routes by role", () => {
    expect(defaultRouteForRole("BRANCH_MANAGER")).toBe("/dashboard");
    expect(defaultRouteForRole("SUPERVISOR")).toBe("/supervisor");
  });

  it("public API paths", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/auth/login")).toBe(true);
    expect(isPublicApiPath("/api/eod")).toBe(false);
  });

  it("pilot permissions by role", () => {
    expect(hasPermission("BRANCH_STAFF", Permission.PILOT_FEEDBACK_CREATE)).toBe(true);
    expect(hasPermission("BRANCH_STAFF", Permission.PILOT_VIEW)).toBe(false);
    expect(hasPermission("SUPERVISOR", Permission.PILOT_VIEW)).toBe(true);
    expect(hasPermission("HO_ADMIN", Permission.PILOT_FEEDBACK_TRIAGE)).toBe(true);
    expect(hasPermission("AUDITOR", Permission.PILOT_FEEDBACK_TRIAGE)).toBe(false);
  });

  it("ops view is HO admin only", () => {
    expect(hasPermission("HO_ADMIN", Permission.OPS_VIEW)).toBe(true);
    expect(hasPermission("SUPERVISOR", Permission.OPS_VIEW)).toBe(false);
  });
});
