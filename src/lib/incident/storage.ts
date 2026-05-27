import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { IncidentAttachmentKind } from "@prisma/client";
import {
  ALLOWED_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "./constants";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "incidents");

export function mimeToKind(mimeType: string): IncidentAttachmentKind {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "SCREENSHOT";
  return "EVIDENCE";
}

export function validateAttachmentFile(
  mimeType: string,
  sizeBytes: number,
): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("File type not allowed. Use PNG, JPEG, WebP, or PDF.");
  }
  if (sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new Error("File exceeds 8 MB limit.");
  }
}

export async function saveIncidentAttachment(
  incidentId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<{ storageKey: string; kind: IncidentAttachmentKind }> {
  validateAttachmentFile(mimeType, buffer.length);

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const storageKey = `${incidentId}/${randomBytes(8).toString("hex")}-${safeName}`;
  const fullPath = path.join(STORAGE_ROOT, storageKey);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);

  return { storageKey, kind: mimeToKind(mimeType) };
}

export async function readIncidentAttachment(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_ROOT, storageKey);
  if (fullPath.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return readFile(fullPath);
}
