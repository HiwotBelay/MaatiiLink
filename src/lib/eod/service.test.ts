import { describe, expect, it } from "vitest";
import {
  canEditEod,
  canSubmitEod,
  canLockEod,
} from "./service";
import { getAddisDateString } from "./constants";

describe("eod permissions", () => {
  it("manager can submit draft", () => {
    expect(canSubmitEod("DRAFT", "BRANCH_MANAGER")).toBe(true);
  });

  it("staff cannot submit", () => {
    expect(canSubmitEod("DRAFT", "BRANCH_STAFF")).toBe(false);
  });

  it("supervisor can lock submitted", () => {
    expect(canLockEod("SUBMITTED", "SUPERVISOR")).toBe(true);
  });

  it("cannot edit submitted", () => {
    expect(canEditEod("SUBMITTED", "BRANCH_MANAGER")).toBe(false);
  });
});

describe("eod constants", () => {
  it("returns addis date as YYYY-MM-DD", () => {
    expect(getAddisDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
