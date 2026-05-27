import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditModule, writeAuditLog } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import { sessionCookieOptions } from "@/lib/auth/session";
import { createUserSession } from "@/lib/auth/session-manager";
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
import { isAccountLocked, registerFailedLogin, resetFailedLogins } from "@/lib/security/account-lock";
import { recordLoginActivity } from "@/lib/security/login-activity";
import { getRequestSecurityContext } from "@/lib/security/request-context";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = getRequestSecurityContext(request);

    if (!checkLoginRateLimit(ctx.ipAddress)) {
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
      await recordLoginActivity({
        email,
        success: false,
        failureReason: "INVALID_CREDENTIALS",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      await writeAuditLog({
        action: "LOGIN_FAILED",
        module: AuditModule.AUTH,
        entityType: "User",
        metadata: { email, reason: "invalid_credentials" },
        request: ctx,
      });
      return jsonError("Invalid email or password", 401);
    }

    if (isAccountLocked(user.lockedUntil)) {
      await recordLoginActivity({
        email,
        success: false,
        userId: user.id,
        branchId: user.branchId,
        failureReason: "ACCOUNT_LOCKED",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      return jsonError(
        "Account temporarily locked due to failed sign-in attempts. Try again later or contact IT.",
        423,
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      await registerFailedLogin(user.id);
      await recordLoginActivity({
        email,
        success: false,
        userId: user.id,
        branchId: user.branchId,
        failureReason: "INVALID_PASSWORD",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      await writeAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        module: AuditModule.AUTH,
        entityType: "User",
        entityId: user.id,
        branchId: user.branchId,
        metadata: { reason: "invalid_password" },
        request: ctx,
      });
      return jsonError("Invalid email or password", 401);
    }

    resetLoginRateLimit(ctx.ipAddress);
    await resetFailedLogins(user.id);

    const { token } = await createUserSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branchId: user.branchId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      deviceLabel: ctx.deviceLabel,
    });

    await recordLoginActivity({
      email,
      success: true,
      userId: user.id,
      branchId: user.branchId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    await writeAuditLog({
      userId: user.id,
      action: "LOGIN",
      module: AuditModule.AUTH,
      entityType: "User",
      entityId: user.id,
      branchId: user.branchId,
      newValue: { role: user.role, email: user.email },
      request: ctx,
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
