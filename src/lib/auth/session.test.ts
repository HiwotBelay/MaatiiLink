import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("session", () => {
  it("round-trips a valid session token", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-characters-long!!";

    const token = await createSessionToken({
      sub: "user-1",
      email: "test@maatiilink.local",
      name: "Test User",
      role: "BRANCH_MANAGER",
      branchId: "branch-1",
      sessionId: "sess-test-1",
    });

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-1");
    expect(payload?.role).toBe("BRANCH_MANAGER");
    expect(payload?.branchId).toBe("branch-1");
  });

  it("rejects tampered token", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-characters-long!!";
    const token = await createSessionToken({
      sub: "user-1",
      email: "test@maatiilink.local",
      name: "Test",
      role: "BRANCH_STAFF",
      branchId: null,
      sessionId: "sess-test-2",
    });
    const bad = token.slice(0, -4) + "xxxx";
    expect(await verifySessionToken(bad)).toBeNull();
  });
});
