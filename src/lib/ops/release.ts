import { readFileSync } from "fs";
import { join } from "path";

let cachedVersion: string | null = null;

/** App release version (package.json) or RELEASE_VERSION env override. */
export function getReleaseVersion(): string {
  if (process.env.RELEASE_VERSION?.trim()) {
    return process.env.RELEASE_VERSION.trim();
  }
  if (cachedVersion) return cachedVersion;
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    cachedVersion = pkg.version ?? "0.0.0";
  } catch {
    cachedVersion = "0.0.0";
  }
  return cachedVersion;
}

export function getDeploymentEnvironment(): string {
  return process.env.NODE_ENV === "production" ? "production" : "non-production";
}
