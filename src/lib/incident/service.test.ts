import { describe, expect, it } from "vitest";
import { STATUS_TRANSITIONS } from "./constants";

describe("incident status transitions", () => {
  it("allows OPEN to ESCALATED", () => {
    expect(STATUS_TRANSITIONS.OPEN).toContain("ESCALATED");
  });

  it("does not allow CLOSED to change", () => {
    expect(STATUS_TRANSITIONS.CLOSED).toHaveLength(0);
  });

  it("allows RESOLVED to CLOSED only", () => {
    expect(STATUS_TRANSITIONS.RESOLVED).toEqual(["CLOSED"]);
  });
});
