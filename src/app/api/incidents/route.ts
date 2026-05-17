import { NextRequest } from "next/server";
import type { IncidentSeverity, IncidentStatus } from "@prisma/client";
import { Permission } from "@/lib/rbac";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError, jsonOk, jsonValidation } from "@/lib/api/http";
import {
  createIncident,
  listIncidents,
  IncidentError,
} from "@/lib/incident/service";
import { serializeIncident } from "@/lib/incident/serialize";
import { incidentCreateSchema } from "@/lib/incident/validation";

export async function GET(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_VIEW_BRANCH,
  );
  if (error || !user) return error!;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as IncidentStatus | null;
  const severity = searchParams.get("severity") as IncidentSeverity | null;

  try {
    const incidents = await listIncidents(user, {
      status: status ?? undefined,
      severity: severity ?? undefined,
    });
    return jsonOk({
      ok: true,
      incidents: incidents.map(serializeIncident),
    });
  } catch (e) {
    if (e instanceof IncidentError) {
      const statusCode = e.code === "FORBIDDEN" ? 403 : 400;
      return jsonError(e.message, statusCode);
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_CREATE,
  );
  if (error || !user) return error!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = incidentCreateSchema.safeParse(body);
  if (!parsed.success) return jsonValidation(parsed.error);

  try {
    const incident = await createIncident(user, parsed.data);
    return jsonOk(
      { ok: true, incident: serializeIncident(incident) },
      201,
    );
  } catch (e) {
    if (e instanceof IncidentError) {
      const statusCode =
        e.code === "FORBIDDEN" ? 403 : e.code === "NO_BRANCH" ? 400 : 400;
      return jsonError(e.message, statusCode);
    }
    throw e;
  }
}
