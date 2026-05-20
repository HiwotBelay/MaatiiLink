import type { Role } from "@prisma/client";
import { getApiRoutePermission, hasPermission } from "@/lib/rbac";

export function isApiRouteAllowed(
  role: Role,
  pathname: string,
  method: string,
): boolean {
  const permission = getApiRoutePermission(pathname, method);
  if (permission === undefined) return false;
  if (permission === "SESSION_ONLY") return true;
  return hasPermission(role, permission);
}
