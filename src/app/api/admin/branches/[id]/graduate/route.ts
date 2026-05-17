import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonOk } from "@/lib/api/http";
import { graduateBranchFromPilot } from "@/lib/admin/provision";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(request, Permission.ADMIN_USERS);
  if (error || !user) return error!;

  const { id } = await params;
  const branch = await graduateBranchFromPilot(user.id, id);
  return jsonOk({ ok: true, branch });
}
