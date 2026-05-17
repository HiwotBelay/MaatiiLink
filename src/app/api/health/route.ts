import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function sessionSecretConfigured(): boolean {
  const secret = process.env.SESSION_SECRET;
  return Boolean(secret && secret.length >= 32);
}

export async function GET() {
  const authConfigured = sessionSecretConfigured();

  try {
    const branchCount = await prisma.branch.count();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      ok: authConfigured,
      service: "MaatiiLink",
      database: "connected",
      auth: authConfigured ? "configured" : "missing SESSION_SECRET (min 32 chars)",
      stats: { branches: branchCount, users: userCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        service: "MaatiiLink",
        database: "disconnected",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
