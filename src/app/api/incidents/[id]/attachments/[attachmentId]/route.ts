import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api/with-auth";
import { jsonError } from "@/lib/api/http";
import { Permission } from "@/lib/rbac";
import { canViewIncident } from "@/lib/incident/access";
import { readIncidentAttachment } from "@/lib/incident/storage";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { error, user } = await requireApiUser(
    request,
    Permission.INCIDENT_VIEW_BRANCH,
  );
  if (error || !user) return error!;

  const { id, attachmentId } = await params;

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident || !canViewIncident(user, incident)) {
    return jsonError("Forbidden", 403);
  }

  const attachment = await prisma.incidentAttachment.findFirst({
    where: { id: attachmentId, incidentId: id },
  });
  if (!attachment) return jsonError("Not found", 404);

  const buffer = await readIncidentAttachment(attachment.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
    },
  });
}
