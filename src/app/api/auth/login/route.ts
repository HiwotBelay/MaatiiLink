import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { defaultRouteForRole } from "@/lib/rbac";
import {
  jsonError,
  jsonOk,
  jsonValidation,
} from "@/lib/api/http";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "@/lib/api/rate-limit";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkLoginRateLimit(ip)) {
      return jsonError("Too many login attempts. Try again later.", 429);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonValidation(parsed.error);
    }

    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: { select: { name: true, branchCode: true } } },
    });

    if (!user || !user.isActive) {
      return jsonError("Invalid email or password", 401);
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return jsonError("Invalid email or password", 401);
    }

    resetLoginRateLimit(ip);

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
    });

    await writeAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const response = jsonOk({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
          ? { name: user.branch.name, branchCode: user.branch.branchCode }
          : null,
      },
      redirectTo: defaultRouteForRole(user.role),
    });

    response.cookies.set(sessionCookieOptions().name, token, {
      httpOnly: sessionCookieOptions().httpOnly,
      secure: sessionCookieOptions().secure,
      sameSite: sessionCookieOptions().sameSite,
      path: sessionCookieOptions().path,
      maxAge: sessionCookieOptions().maxAge,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[auth/login]", message);

    if (message.includes("SESSION_SECRET")) {
      return jsonError(
        "Server is missing SESSION_SECRET (32+ characters in Vercel env).",
        503,
      );
    }

    return jsonError("Login failed. Please try again.", 500);
  }
}
