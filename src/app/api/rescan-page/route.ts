import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Browser } from "puppeteer";
import { launchBrowser, readAxeSource, scanPageWithAxe } from "@/lib/axe-scan";

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    const body = await request.json();
    const { scanRunId, pageUrl } = body;

    if (!scanRunId || typeof scanRunId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'scanRunId'" },
        { status: 400 }
      );
    }
    if (!pageUrl || typeof pageUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'pageUrl'" },
        { status: 400 }
      );
    }

    // ── Fetch only issues that are being actively worked on ────────────
    // No point re-verifying untouched issues (not_started)
    const issuesToCheck = await prisma.issue.findMany({
      where: {
        scanRunId,
        pageUrl,
        status: { not: "not_started" },
      },
    });

    if (issuesToCheck.length === 0) {
      return NextResponse.json(
        {
          error:
            "No in-progress issues found for this page. Mark at least one issue as 'In Progress' before re-verifying.",
        },
        { status: 400 }
      );
    }

    // ── Run axe-core on the live page ───────────────────────────────────
    const axeSource = readAxeSource();
    browser = await launchBrowser();
    const page = await browser.newPage();

    const violations = await scanPageWithAxe(page, pageUrl, axeSource);

    // Build a Set of ruleIds still present in the current scan
    const activeRuleIds = new Set(violations.map((v) => v.id));

    // ── Update each issue's status ──────────────────────────────────────
    const now = new Date();
    const updatedIssues = [];
    let verifiedCount = 0;
    let stillOpenCount = 0;

    for (const issue of issuesToCheck) {
      if (!activeRuleIds.has(issue.ruleId)) {
        // Rule no longer present — the fix worked!
        const updated = await prisma.issue.update({
          where: { id: issue.id },
          data: { status: "verified", lastVerified: now },
        });
        updatedIssues.push(updated);
        verifiedCount++;
      } else {
        // Still broken — leave status unchanged
        updatedIssues.push(issue);
        stillOpenCount++;
      }
    }

    return NextResponse.json({
      verifiedCount,
      stillOpenCount,
      updatedIssues,
    });
  } catch (err) {
    console.error("Rescan failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Re-scan failed: ${err.message}`
            : "An unexpected error occurred during re-scanning",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
