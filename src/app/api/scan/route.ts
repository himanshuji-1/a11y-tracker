import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Browser } from "puppeteer";
import { extractWcagCriterion, launchBrowser, readAxeSource, scanPageWithAxe } from "@/lib/axe-scan";


export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    // ── Parse & validate URL ──────────────────────────────────────────
    const body = await request.json();
    let rawUrl: string = body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    rawUrl = rawUrl.trim();

    // Add protocol if missing
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const normalizedUrl = parsedUrl.href;

    // ── Upsert Site ───────────────────────────────────────────────────
    let site = await prisma.site.findFirst({
      where: { url: normalizedUrl },
    });

    if (!site) {
      site = await prisma.site.create({
        data: { url: normalizedUrl },
      });
    }

    // ── Create ScanRun ────────────────────────────────────────────────
    const scanRun = await prisma.scanRun.create({
      data: { siteId: site.id },
    });

    // ── Read axe-core from disk ───────────────────────────────────────
    const axeSource = readAxeSource();

    // ── Launch Puppeteer ──────────────────────────────────────────────
    browser = await launchBrowser();

    const page = await browser.newPage();

    // Navigate to homepage
    try {
      await page.goto(normalizedUrl, {
        timeout: 15000,
        waitUntil: "domcontentloaded",
      });
    } catch {
      // If homepage is totally unreachable, bail out
      await prisma.scanRun.update({
        where: { id: scanRun.id },
        data: { completedAt: new Date(), pagesScanned: 0, score: 0 },
      });
      return NextResponse.json(
        { error: `Could not reach that URL: ${normalizedUrl}` },
        { status: 400 }
      );
    }

    // ── Extract internal links from nav/header ────────────────────────
    const homepageOrigin = parsedUrl.origin;
    const homepageHref = parsedUrl.href;

    const internalLinks: string[] = await page.evaluate(
      (origin: string, homepage: string) => {
        const links: string[] = [];
        const seen = new Set<string>();

        // Look for links in nav and header elements
        const navHeaders = document.querySelectorAll("nav, header");
        const anchors: HTMLAnchorElement[] = [];

        navHeaders.forEach((el) => {
          el.querySelectorAll("a[href]").forEach((a) => {
            anchors.push(a as HTMLAnchorElement);
          });
        });

        for (const a of anchors) {
          if (links.length >= 3) break;

          const href = a.href; // already resolved to absolute
          if (!href) continue;

          // Skip anchors, mailto, tel, javascript
          if (
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            href.startsWith("javascript:") ||
            href.includes("#")
          )
            continue;

          // Must be same origin
          try {
            const url = new URL(href);
            if (url.origin !== origin) continue;

            const normalized = url.origin + url.pathname;
            const homepageNorm =
              new URL(homepage).origin + new URL(homepage).pathname;

            // Skip if it's the homepage itself
            if (normalized === homepageNorm) continue;

            if (seen.has(normalized)) continue;
            seen.add(normalized);

            links.push(url.href);
          } catch {
            continue;
          }
        }

        return links;
      },
      homepageOrigin,
      homepageHref
    );

    // ── Build page list ───────────────────────────────────────────────
    const pageList = [normalizedUrl, ...internalLinks.slice(0, 3)].slice(0, 4);

    // ── Scan each page with axe-core ──────────────────────────────────
    let pagesScanned = 0;
    const allIssueData: {
      scanRunId: string;
      pageUrl: string;
      wcagCriterion: string;
      severity: string;
      ruleId: string;
      description: string;
      htmlSnippet: string;
    }[] = [];

    for (const pageUrl of pageList) {
      try {
        // Navigate and scan (for homepage on first pass, we're already there;
        // scanPageWithAxe always navigates so we pass the URL regardless)
        const violations = await scanPageWithAxe(page, pageUrl, axeSource);

        // Process violations
        for (const violation of violations) {
          const wcagCriterion = extractWcagCriterion(violation.tags);
          const severity = violation.impact || "moderate";
          const nodesToProcess = violation.nodes.slice(0, 3); // Cap at 3 nodes

          for (const node of nodesToProcess) {
            allIssueData.push({
              scanRunId: scanRun.id,
              pageUrl,
              wcagCriterion,
              severity,
              ruleId: violation.id,
              description: violation.help,
              htmlSnippet: node.html.slice(0, 300), // Truncate to 300 chars
            });
          }
        }

        pagesScanned++;
      } catch (err) {
        // If a page fails to load, skip it and continue
        console.error(`Failed to scan page ${pageUrl}:`, err);
        continue;
      }
    }

    // ── Create Issue records in bulk ──────────────────────────────────
    if (allIssueData.length > 0) {
      await prisma.issue.createMany({ data: allIssueData });
    }

    // ── Compute score ─────────────────────────────────────────────────
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    for (const issue of allIssueData) {
      switch (issue.severity) {
        case "critical":
          criticalCount++;
          break;
        case "serious":
          seriousCount++;
          break;
        case "moderate":
          moderateCount++;
          break;
        case "minor":
          minorCount++;
          break;
      }
    }

    const score = Math.max(
      0,
      100 -
        (criticalCount * 10 +
          seriousCount * 5 +
          moderateCount * 2 +
          minorCount * 1)
    );

    // ── Update ScanRun ────────────────────────────────────────────────
    const completedScan = await prisma.scanRun.update({
      where: { id: scanRun.id },
      data: {
        completedAt: new Date(),
        pagesScanned,
        score,
      },
      include: { issues: true },
    });

    return NextResponse.json(completedScan);
  } catch (err) {
    console.error("Scan failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during scanning",
      },
      { status: 400 }
    );
  } finally {
    // ── Always close the browser ────────────────────────────────────
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
