import type { NextRequest } from "next/server";

export type RequestSecurityContext = {
  ipAddress: string;
  userAgent: string;
  deviceLabel: string;
};

export function getRequestSecurityContext(
  request: NextRequest,
): RequestSecurityContext {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const deviceLabel = parseDeviceLabel(userAgent);

  return { ipAddress, userAgent, deviceLabel };
}

function parseDeviceLabel(userAgent: string): string {
  if (/Mobile|Android|iPhone/i.test(userAgent)) return "Mobile";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown device";
}
