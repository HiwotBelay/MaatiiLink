import { prisma } from "@/lib/prisma";
import { createNotificationsForUsers } from "./in-app";
import {
  notifyIncidentEscalation,
  notifyHoIncidentCritical,
} from "./email";

type IncidentNotifyPayload = {
  incidentId: string;
  incidentRef: string;
  title: string;
  severity: string;
  branchName: string;
  reporterName: string;
  event: "created" | "assigned" | "escalated" | "sla_breach" | "critical";
};

async function supervisorAndHoUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: [
          "REGIONAL_SUPERVISOR",
          "HO_OPERATIONS",
          "SUPER_ADMIN",
          "COMPLIANCE_OFFICER",
        ],
      },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function notifyIncidentStakeholders(payload: IncidentNotifyPayload) {
  const link = `/incidents?highlight=${payload.incidentId}`;
  const title =
    payload.event === "sla_breach"
      ? `SLA breach: ${payload.title}`
      : payload.event === "critical"
        ? `Critical incident: ${payload.title}`
        : `Incident ${payload.event}: ${payload.title}`;

  const body = `${payload.incidentRef} · ${payload.severity} · ${payload.branchName} · reported by ${payload.reporterName}`;

  const recipientIds = await supervisorAndHoUserIds();
  await createNotificationsForUsers(recipientIds, {
    type: "INCIDENT",
    title,
    body,
    link,
    metadata: {
      incidentId: payload.incidentId,
      severity: payload.severity,
      event: payload.event,
    },
  });

  if (payload.severity === "CRITICAL" || payload.event === "sla_breach") {
    void notifyIncidentEscalation({
      incidentId: payload.incidentId,
      title: payload.title,
      severity: payload.severity,
      branchName: payload.branchName,
      reporterName: payload.reporterName,
      event: payload.event === "sla_breach" ? "escalated" : "created",
    });
    void notifyHoIncidentCritical({
      incidentRef: payload.incidentRef,
      title: payload.title,
      branchName: payload.branchName,
      event: payload.event,
    });
  }
}

export async function notifyAssignee(
  assigneeId: string,
  payload: IncidentNotifyPayload,
) {
  const { createInAppNotification } = await import("./in-app");
  await createInAppNotification({
    userId: assigneeId,
    type: "INCIDENT_ASSIGNED",
    title: `Assigned: ${payload.title}`,
    body: `${payload.incidentRef} · ${payload.severity}`,
    link: `/incidents?highlight=${payload.incidentId}`,
    metadata: { incidentId: payload.incidentId },
  });
}
