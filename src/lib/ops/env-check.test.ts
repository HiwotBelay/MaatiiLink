import { describe, expect, it, afterEach } from "vitest";
import { checkSessionSecret, runEnvChecks } from "./env-check";

describe("env-check", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    delete process.env.APP_URL;
  });

  it("fails weak session secrets", () => {
    process.env.SESSION_SECRET = "generate-a-long-random-secret";
    expect(checkSessionSecret()).toBe("fail");
  });

  it("passes strong session secret", () => {
    process.env.SESSION_SECRET = "x".repeat(32);
    expect(checkSessionSecret()).toBe("ok");
  });

  it("marks production ready when required vars set", () => {
    process.env.DATABASE_URL = "postgresql://u:p@host/db";
    process.env.DIRECT_URL = "postgresql://u:p@host/db";
    process.env.APP_URL = "https://maatii-link.vercel.app";
    process.env.SESSION_SECRET = "a".repeat(40);
    const result = runEnvChecks();
    expect(result.checks.databaseUrl).toBe("ok");
    expect(result.checks.sessionSecret).toBe("ok");
  });
});
