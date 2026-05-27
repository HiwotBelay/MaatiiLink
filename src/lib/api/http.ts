import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonUnauthorized(message = "Unauthorized") {
  return jsonError(message, 401);
}

export function jsonForbidden(message = "Forbidden") {
  return jsonError(message, 403);
}

export function jsonValidation(error: ZodError) {
  return NextResponse.json(
    { ok: false, error: "Validation failed", details: error.flatten() },
    { status: 400 },
  );
}
