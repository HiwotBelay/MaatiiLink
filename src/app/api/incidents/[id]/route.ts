import { NextRequest } from "next/server";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  getIncidentById,
  updateIncident,
  IncidentError,
} from "@/lib/incident/service";
import { serializeIncident } from "@/lib/incident/serialize";
import { incidentUpdateSchema } from "@/lib/incident/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_VIEW_BRANCH,
  );
  if (error || !user) return error!;

  const { id } = await params;

  try {
    const incident = await getIncidentById(user, id);
    if (!incident) return jsonError("Not found", 404);
    return jsonOk({ ok: true, incident: serializeIncident(incident) });
  } catch (e) {
    if (e instanceof IncidentError && e.code === "FORBIDDEN") {
      return jsonError(e.message, 403);
    }
    throw e;
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_UPDATE,
  );
  if (error || !user) return error!;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = incidentUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const incident = await updateIncident(user, id, parsed.data);
    return jsonOk({ ok: true, incident: serializeIncident(incident) });
  } catch (e) {
    if (e instanceof IncidentError) {
      const statusCode =
        e.code === "FORBIDDEN"
          ? 403
          : e.code === "NOT_FOUND"
            ? 404
            : 400;
      return jsonError(e.message, statusCode);
    }
    throw e;
  }
}
