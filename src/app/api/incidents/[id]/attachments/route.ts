import { NextRequest } from "next/server";
import { requireApiUserAny } from "@/lib/api/with-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { addIncidentAttachment, getIncidentById, IncidentError } from "@/lib/incident/service";
import { serializeIncident } from "@/lib/incident/serialize";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUserAny(request, [
    Permission.INCIDENT_CREATE,
    Permission.INCIDENT_UPDATE,
  ]);
  if (error || !user) return error!;

  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Missing file upload", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await addIncidentAttachment(user, id, {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });
    const incident = await getIncidentById(user, id);
    return jsonOk({ ok: true, incident: incident ? serializeIncident(incident) : null });
  } catch (e) {
    if (e instanceof IncidentError) {
      return jsonError(e.message, e.code === "FORBIDDEN" ? 403 : 400);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    throw e;
  }
}
