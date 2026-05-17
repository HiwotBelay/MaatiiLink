import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runEnvChecks } from "@/lib/ops/env-check";
import { getDeploymentEnvironment, getReleaseVersion } from "@/lib/ops/release";

export async function GET() {
  const env = runEnvChecks();

  try {
    const branchCount = await prisma.branch.count();
    const userCount = await prisma.user.count();

    const ok = env.productionReady && env.checks.databaseUrl === "ok";

    return NextResponse.json(
      {
        ok,
        service: "MaatiiLink",
        version: getReleaseVersion(),
        environment: getDeploymentEnvironment(),
        database: "connected",
        env: {
          status: env.status,
          productionReady: env.productionReady,
          checks: env.checks,
        },
        stats: { branches: branchCount, users: userCount },
        timestamp: new Date().toISOString(),
      },
      { status: ok ? 200 : 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        service: "MaatiiLink",
        version: getReleaseVersion(),
        environment: getDeploymentEnvironment(),
        database: "disconnected",
        env: {
          status: env.status,
          productionReady: false,
          checks: env.checks,
        },
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
