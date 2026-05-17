import nodemailer from "nodemailer";

type IncidentNotify = {
  incidentId: string;
  title: string;
  severity: string;
  branchName: string;
  reporterName: string;
  event: "created" | "escalated" | "updated";
};

type DirectiveNotify = {
  directiveId: string;
  title: string;
  isCritical: boolean;
  deadlineAt: Date | null;
  publisherName: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

function supervisorRecipients(): string[] {
  const raw = process.env.SUPERVISOR_NOTIFY_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

async function sendMail(subject: string, text: string) {
  const transporter = getTransporter();
  const to = supervisorRecipients();
  const from = process.env.NOTIFY_FROM ?? "maatiilink@localhost";

  if (!transporter || to.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.info("[notify] skipped (SMTP or recipients not configured):", subject);
    }
    return;
  }

  try {
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[notify] email failed:", err);
  }
}

export async function notifyIncidentEscalation(payload: IncidentNotify) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const subject = `[MaatiiLink] ${payload.severity} incident ${payload.event}: ${payload.title}`;
  const text = [
    `Incident ${payload.event} in MaatiiLink`,
    ``,
    `Title: ${payload.title}`,
    `Severity: ${payload.severity}`,
    `Branch: ${payload.branchName}`,
    `Reported by: ${payload.reporterName}`,
    `ID: ${payload.incidentId}`,
    ``,
    `Review: ${appUrl}/supervisor`,
  ].join("\n");

  await sendMail(subject, text);
}

export async function notifyDirectivePublished(payload: DirectiveNotify) {
  if (!payload.isCritical) return;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const deadline = payload.deadlineAt
    ? payload.deadlineAt.toISOString().slice(0, 10)
    : "none";
  const subject = `[MaatiiLink] Critical HO directive: ${payload.title}`;
  const text = [
    `A critical directive was published.`,
    ``,
    `Title: ${payload.title}`,
    `Published by: ${payload.publisherName}`,
    `Deadline: ${deadline}`,
    `ID: ${payload.directiveId}`,
    ``,
    `Branches must acknowledge: ${appUrl}/directives`,
  ].join("\n");

  await sendMail(subject, text);
}
