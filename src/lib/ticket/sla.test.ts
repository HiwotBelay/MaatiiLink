import { describe, expect, it } from "vitest";
import { slaHoursRemaining, slaTargetHours, isSlaBreached } from "./sla";

describe("ticket SLA", () => {
  it("returns correct target hours by priority", () => {
    expect(slaTargetHours("URGENT")).toBe(24);
    expect(slaTargetHours("LOW")).toBe(168);
  });

  it("detects breach when past due and still open", () => {
    const created = new Date("2020-01-01T00:00:00Z");
    const now = new Date("2020-01-03T00:00:00Z");
    expect(isSlaBreached(created, "URGENT", "OPEN", now)).toBe(true);
  });

  it("does not breach when resolved", () => {
    const created = new Date("2020-01-01T00:00:00Z");
    const now = new Date("2020-02-01T00:00:00Z");
    expect(isSlaBreached(created, "URGENT", "RESOLVED", now)).toBe(false);
  });

  it("computes hours remaining", () => {
    const created = new Date();
    const left = slaHoursRemaining(created, "MEDIUM");
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThanOrEqual(72);
  });
});
