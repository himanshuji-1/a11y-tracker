import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { launchBrowser } from "@/lib/axe-scan";
import { Browser } from "puppeteer";

export async function GET(
  request: NextRequest,
  { params }: { params: { scanRunId: string } }
) {
  let browser: Browser | null = null;
  try {
    const scanRunId = params.scanRunId;

    if (!scanRunId || typeof scanRunId !== "string") {
      return NextResponse.json({ error: "Invalid scanRunId" }, { status: 400 });
    }

    // Validate the scan actually exists so we can grab the URL for the filename
    const scanRun = await prisma.scanRun.findUnique({
      where: { id: scanRunId },
      include: { site: true }
    });

    if (!scanRun) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    // Determine base URL dynamically based on environment
    // Vercel sets VERCEL_PROJECT_PRODUCTION_URL and VERCEL_URL. Fallback to localhost for local dev.
    const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    const baseUrl = vercelHost ? `https://${vercelHost}` : (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
    const reportUrl = `${baseUrl}/report-print/${scanRunId}`;

    // Launch Browserless/Puppeteer to generate PDF
    browser = await launchBrowser();

    const page = await browser.newPage();
    
    // Wait until network is idle to ensure all styles and content have rendered
    await page.goto(reportUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Hide any Next.js development overlays (like the build watcher or error portal)
    await page.addStyleTag({
      content: "nextjs-portal, #__next-build-watcher { display: none !important; }",
    });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "30px",
        right: "30px",
      },
    });

    // Sanitize site URL for filename
    const siteSlug = scanRun.site.url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `accessibility-report-${siteSlug}-${dateStr}.pdf`;

    // Next.js NextResponse types sometimes complain about Buffer/Uint8Array in older Edge types, so we cast to any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json({ error: "Failed to generate PDF report" }, { status: 500 });
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
