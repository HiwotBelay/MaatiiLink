import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonForbidden, jsonOk } from "@/lib/api/http";
import { hasPermission, Permission } from "@/lib/rbac";
import { getTicketAnalytics } from "@/lib/ticket/analytics";

function canViewTickets(role: Parameters<typeof hasPermission>[0]) {
  return (
    hasPermission(role, Permission.TICKET_VIEW_BRANCH) ||
    hasPermission(role, Permission.TICKET_VIEW_ALL)
  );
}

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;
  if (!canViewTickets(user.role)) return jsonForbidden();

  const analytics = await getTicketAnalytics(user);
  return jsonOk({ ok: true, analytics });
}
