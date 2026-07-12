import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["not_started", "in_progress", "fixed", "verified"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.issue.update({
      where: { id: params.id },
      data: {
        status,
        lastVerified: status === "verified" ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update issue:", err);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
