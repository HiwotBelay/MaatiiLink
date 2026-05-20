import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { listNotificationsForUser } from "@/lib/notifications/in-app";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 30);
  const notifications = await listNotificationsForUser(user.id, limit);

  return jsonOk({
    ok: true,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
