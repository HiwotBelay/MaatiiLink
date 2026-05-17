import { prisma } from "@/lib/prisma";
import { runEnvChecks } from "./env-check";
import { getDeploymentEnvironment, getReleaseVersion } from "./release";

export type OpsStatus = {
  release: string;
  environment: string;
  env: ReturnType<typeof runEnvChecks>;
  database: "connected" | "disconnected";
  counts: {
    branches: number;
    pilotBranches: number;
    users: number;
    activeUsers: number;
  };
  timestamp: string;
};

export async function getOpsStatus(): Promise<OpsStatus> {
  const env = runEnvChecks();

  try {
    const [branches, pilotBranches, users, activeUsers] = await Promise.all([
      prisma.branch.count(),
      prisma.branch.count({ where: { isPilotBranch: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      release: getReleaseVersion(),
      environment: getDeploymentEnvironment(),
      env,
      database: "connected",
      counts: { branches, pilotBranches, users, activeUsers },
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      release: getReleaseVersion(),
      environment: getDeploymentEnvironment(),
      env,
      database: "disconnected",
      counts: { branches: 0, pilotBranches: 0, users: 0, activeUsers: 0 },
      timestamp: new Date().toISOString(),
    };
  }
}
