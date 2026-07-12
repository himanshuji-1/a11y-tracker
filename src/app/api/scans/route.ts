import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scans = await prisma.scanRun.findMany({
      orderBy: {
        startedAt: "desc",
      },
      take: 20,
      include: {
        site: true,
        _count: {
          select: { issues: true },
        },
      },
    });

    return NextResponse.json(scans);
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return NextResponse.json({ error: "Failed to fetch recent scans" }, { status: 500 });
  }
}
