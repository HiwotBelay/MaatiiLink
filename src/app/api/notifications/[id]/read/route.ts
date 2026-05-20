import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk, jsonError } from "@/lib/api/http";
import { markNotificationRead } from "@/lib/notifications/in-app";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request);
  if (error || !user) return error!;

  const { id } = await params;
  const result = await markNotificationRead(user.id, id);
  if (result.count === 0) return jsonError("Not found", 404);
  return jsonOk({ ok: true });
}
