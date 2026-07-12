import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanRunId, regenerate } = body;

    if (!scanRunId || typeof scanRunId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'scanRunId' field" },
        { status: 400 }
      );
    }

    // Fetch the scan with site and issues
    const scanRun = await prisma.scanRun.findUnique({
      where: { id: scanRunId },
      include: { site: true, issues: true },
    });

    if (!scanRun) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    // Return cached statement if it exists and regenerate is not requested
    if (scanRun.statementText && !regenerate) {
      return NextResponse.json({ statementText: scanRun.statementText });
    }

    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Add your API key to .env.local — get one free at https://aistudio.google.com/apikey",
        },
        { status: 500 }
      );
    }

    // Compute issue counts
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    let fixedCount = 0;
    for (const issue of scanRun.issues) {
      if (issue.severity in counts) {
        counts[issue.severity as keyof typeof counts]++;
      }
      if (issue.status === "fixed" || issue.status === "verified") {
        fixedCount++;
      }
    }

    const scanDate = new Date(scanRun.startedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Draft a professional accessibility statement for a website, in the style typically published on a company's /accessibility page.

Site: ${scanRun.site.url}
Last reviewed: ${scanDate}
Compliance target: WCAG 2.1 Level AA
Current automated scan found: ${counts.critical} critical, ${counts.serious} serious, ${counts.moderate} moderate issues, with ${fixedCount} already resolved.

The statement should include:
1. A commitment to accessibility for all users
2. The conformance target (WCAG 2.1 AA)
3. An honest note that automated + manual review is ongoing and some issues are actively being remediated (do not claim full compliance if issues remain open)
4. How users can report accessibility barriers (use a generic placeholder: 'accessibility@[yourcompany].com')
5. Last reviewed date

Write it in plain professional prose, 150-250 words, no headers or markdown formatting, ready to publish as-is. Return only the statement text with no preamble.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            statementText: {
              type: "string",
              description: "The complete accessibility statement, 150-250 words, in plain professional prose ready to publish."
            }
          },
          required: ["statementText"]
        }
      },
    });

    const parsed = JSON.parse(result.response.text());
    const statementText = parsed.statementText?.trim();

    // Guard against truncated/empty responses
    if (!statementText || statementText.length < 500) {
      return NextResponse.json(
        { error: "Statement generation returned an incomplete response. Please try again." },
        { status: 500 }
      );
    }

    // Cache in database
    await prisma.scanRun.update({
      where: { id: scanRunId },
      data: { statementText },
    });

    return NextResponse.json({ statementText });
  } catch (err) {
    console.error("Statement API failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Statement generation failed: ${err.message}`
            : "An unexpected error occurred generating the statement",
      },
      { status: 500 }
    );
  }
}
