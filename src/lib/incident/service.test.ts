import { describe, expect, it } from "vitest";
import { STATUS_TRANSITIONS } from "./constants";
import { shouldComplianceEscalate } from "./access";
import { computeSlaDeadlines, isSlaOverdue } from "./sla";

describe("incident status transitions", () => {
  it("allows OPEN to ASSIGNED and ESCALATED", () => {
    expect(STATUS_TRANSITIONS.OPEN).toContain("ASSIGNED");
    expect(STATUS_TRANSITIONS.OPEN).toContain("ESCALATED");
  });

  it("does not allow ARCHIVED to change", () => {
    expect(STATUS_TRANSITIONS.ARCHIVED).toHaveLength(0);
  });

  it("allows RESOLVED to ARCHIVED only", () => {
    expect(STATUS_TRANSITIONS.RESOLVED).toEqual(["ARCHIVED"]);
  });
});

describe("compliance escalation", () => {
  it("flags critical and fraud", () => {
    expect(shouldComplianceEscalate("CRITICAL", "OTHER")).toBe(true);
    expect(shouldComplianceEscalate("LOW", "FRAUD_ATTEMPT")).toBe(true);
    expect(shouldComplianceEscalate("LOW", "OTHER")).toBe(false);
  });
});

describe("SLA", () => {
  it("detects overdue resolution", () => {
    const past = new Date(Date.now() - 1000);
    expect(isSlaOverdue(past, "OPEN")).toBe(true);
    expect(isSlaOverdue(past, "RESOLVED")).toBe(false);
  });

  it("computes deadlines for critical", () => {
    const created = new Date("2026-01-01T12:00:00Z");
    const { slaResponseDueAt, slaResolutionDueAt } = computeSlaDeadlines(
      "CRITICAL",
      created,
    );
    expect(slaResponseDueAt.getTime() - created.getTime()).toBe(2 * 3600 * 1000);
    expect(slaResolutionDueAt.getTime() - created.getTime()).toBe(8 * 3600 * 1000);
  });
});
