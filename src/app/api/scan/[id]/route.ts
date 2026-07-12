import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scanRun = await prisma.scanRun.findUnique({
      where: { id: params.id },
      include: {
        site: true,
        issues: true,
      },
    });

    if (!scanRun) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(scanRun);
  } catch (err) {
    console.error("Failed to fetch scan:", err);
    return NextResponse.json(
      { error: "Failed to fetch scan" },
      { status: 500 }
    );
  }
}
