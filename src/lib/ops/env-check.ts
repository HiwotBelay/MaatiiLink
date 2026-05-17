const WEAK_SESSION_SECRETS = new Set([
  "generate-a-long-random-secret",
  "ci-session-secret-minimum-32-characters-long",
  "changeme",
  "secret",
  "development",
]);

export type EnvCheckStatus = "ok" | "warn" | "fail";

export type EnvCheckResult = {
  status: EnvCheckStatus;
  environment: string;
  checks: {
    databaseUrl: EnvCheckStatus;
    directUrl: EnvCheckStatus;
    sessionSecret: EnvCheckStatus;
    appUrl: EnvCheckStatus;
  };
  messages: string[];
  productionReady: boolean;
};

function normalizeSecret(): string {
  return process.env.SESSION_SECRET?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function checkSessionSecret(): EnvCheckStatus {
  const secret = normalizeSecret();
  if (!secret) return "fail";
  if (secret.length < 32) return "fail";
  if (WEAK_SESSION_SECRETS.has(secret.toLowerCase())) return "fail";
  return "ok";
}

export function runEnvChecks(): EnvCheckResult {
  const isProd = process.env.NODE_ENV === "production";
  const messages: string[] = [];

  const databaseUrl: EnvCheckStatus = process.env.DATABASE_URL?.trim()
    ? "ok"
    : "fail";
  const directUrl: EnvCheckStatus = process.env.DIRECT_URL?.trim() ? "ok" : "warn";
  const sessionSecret = checkSessionSecret();
  const appUrl: EnvCheckStatus = process.env.APP_URL?.trim() ? "ok" : "warn";

  if (databaseUrl === "fail") messages.push("DATABASE_URL is not set");
  if (directUrl === "warn") messages.push("DIRECT_URL missing (migrations may fail on Vercel)");
  if (sessionSecret === "fail") {
    messages.push("SESSION_SECRET missing, too short (<32), or uses a known weak value");
  }
  if (isProd && appUrl === "warn") {
    messages.push("APP_URL should be set in production for CSRF and redirects");
  }

  const checks = { databaseUrl, directUrl, sessionSecret, appUrl };
  const hasFail = Object.values(checks).some((c) => c === "fail");
  const hasWarn = Object.values(checks).some((c) => c === "warn");

  let status: EnvCheckStatus = "ok";
  if (hasFail) status = "fail";
  else if (hasWarn) status = "warn";

  const productionReady =
    databaseUrl === "ok" && sessionSecret === "ok" && (!isProd || appUrl === "ok");

  return {
    status,
    environment: isProd ? "production" : process.env.NODE_ENV ?? "development",
    checks,
    messages,
    productionReady,
  };
}
