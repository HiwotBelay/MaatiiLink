import { describe, expect, it } from "vitest";
import {
  canEditEod,
  canSubmitEod,
  canLockEod,
} from "./service";
import {
  canSubmitStatus,
  canReviewStatus,
  isEditableStatus,
  computeComplianceScore,
} from "./status";

describe("eod service helpers", () => {
  it("branch manager can submit when pending", () => {
    expect(canSubmitEod("PENDING", "BRANCH_MANAGER")).toBe(true);
  });

  it("branch staff cannot submit", () => {
    expect(canSubmitEod("PENDING", "BRANCH_STAFF")).toBe(false);
  });

  it("supervisor can review submitted", () => {
    expect(canLockEod("SUBMITTED", "REGIONAL_SUPERVISOR")).toBe(true);
    expect(canLockEod("PENDING", "REGIONAL_SUPERVISOR")).toBe(false);
  });

  it("status helpers", () => {
    expect(isEditableStatus("PENDING")).toBe(true);
    expect(isEditableStatus("SUBMITTED")).toBe(false);
    expect(canSubmitStatus("PENDING")).toBe(true);
    expect(canReviewStatus("LATE")).toBe(true);
  });

  it("compliance score penalizes late and critical liquidity", () => {
    const score = computeComplianceScore({
      status: "LATE",
      submittedAt: new Date(),
      dueAt: new Date(Date.now() - 3600000),
      complaintCount: 6,
      atmDowntimeMinutes: 150,
      systemDowntimeMinutes: 0,
      liquidityStatus: "CRITICAL",
    });
    expect(score).toBeLessThan(50);
  });
});
