/**
 * Phase 6 production smoke test — run against staging or production URL.
 * Usage: APP_URL=https://maatii-link.vercel.app npx tsx scripts/smoke.ts
 */
const base = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

type Step = { name: string; ok: boolean; detail?: string };

async function main() {
  const steps: Step[] = [];

  try {
    const healthRes = await fetch(`${base}/api/health`);
    const health = (await healthRes.json()) as {
      ok?: boolean;
      database?: string;
      version?: string;
    };
    steps.push({
      name: "GET /api/health",
      ok: healthRes.ok && health.ok === true && health.database === "connected",
      detail: `v${health.version ?? "?"} db=${health.database}`,
    });
  } catch (e) {
    steps.push({
      name: "GET /api/health",
      ok: false,
      detail: e instanceof Error ? e.message : "fetch failed",
    });
  }

  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-real@test.local", password: "wrong" }),
    });
    steps.push({
      name: "POST /api/auth/login (expect 401)",
      ok: loginRes.status === 401,
      detail: `status ${loginRes.status}`,
    });
  } catch (e) {
    steps.push({
      name: "POST /api/auth/login",
      ok: false,
      detail: e instanceof Error ? e.message : "fetch failed",
    });
  }

  const failed = steps.filter((s) => !s.ok);
  for (const s of steps) {
    console.log(`${s.ok ? "✓" : "✗"} ${s.name}${s.detail ? ` — ${s.detail}` : ""}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} step(s) failed against ${base}`);
    process.exit(1);
  }

  console.log(`\nAll smoke checks passed for ${base}`);
}

main();
