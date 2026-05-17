import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const branchCount = await prisma.branch.count();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      ok: true,
      service: "MaatiiLink",
      database: "connected",
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
