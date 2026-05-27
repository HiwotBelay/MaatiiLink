import { describe, expect, it } from "vitest";
import {
  slaHoursRemaining,
  slaTargetHours,
  isSlaBreached,
  computeSlaDeadlines,
  isResponseSlaBreached,
} from "./sla";

describe("ticket SLA", () => {
  it("returns correct target hours by priority", () => {
    expect(slaTargetHours("URGENT")).toBe(24);
    expect(slaTargetHours("LOW")).toBe(168);
  });

  it("computes response and resolution deadlines", () => {
    const created = new Date("2024-01-01T12:00:00Z");
    const { responseDue, resolutionDue } = computeSlaDeadlines(created, "URGENT");
    expect(responseDue.getTime() - created.getTime()).toBe(4 * 60 * 60 * 1000);
    expect(resolutionDue.getTime() - created.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("detects breach when past resolution due and still open", () => {
    const due = new Date("2020-01-02T00:00:00Z");
    const now = new Date("2020-01-03T00:00:00Z");
    expect(isSlaBreached(due, "OPEN", null, now)).toBe(true);
  });

  it("does not breach when resolved", () => {
    const due = new Date("2020-01-01T00:00:00Z");
    const now = new Date("2020-02-01T00:00:00Z");
    expect(isSlaBreached(due, "RESOLVED", null, now)).toBe(false);
  });

  it("detects response SLA breach", () => {
    const responseDue = new Date("2020-01-01T01:00:00Z");
    const now = new Date("2020-01-02T00:00:00Z");
    expect(
      isResponseSlaBreached(responseDue, null, "OPEN", now),
    ).toBe(true);
  });

  it("computes hours remaining", () => {
    const due = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const left = slaHoursRemaining(due, "IN_PROGRESS");
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThanOrEqual(48);
  });
});
