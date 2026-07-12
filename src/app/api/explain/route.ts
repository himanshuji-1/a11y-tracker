import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId } = body;

    if (!issueId || typeof issueId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'issueId' field" },
        { status: 400 }
      );
    }

    // Fetch the issue
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      );
    }

    // If explanation is already cached, return it immediately (skip API cost)
    if (issue.explanation && issue.fixSnippet) {
      return NextResponse.json({
        explanation: issue.explanation,
        fixSnippet: issue.fixSnippet,
      });
    }

    // Validate API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      // NOTE: If you see this error, add your Gemini API key to .env.local
      // Get one free at: https://aistudio.google.com/apikey
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Add your API key to .env.local — get one free at https://aistudio.google.com/apikey",
        },
        { status: 500 }
      );
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an accessibility engineer reviewing a WCAG violation found by automated testing.

WCAG Criterion: ${issue.wcagCriterion}
Rule: ${issue.ruleId} - ${issue.description}
Failing HTML:
${issue.htmlSnippet}

Explain why this fails accessibility, who it affects, and the real-world impact.
Also provide a corrected HTML/CSS code snippet fixing the issue.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            explanation: {
              type: SchemaType.STRING,
              description: "A 2-3 sentence plain-English explanation of why this is an accessibility barrier."
            },
            fixSnippet: {
              type: SchemaType.STRING,
              description: "A concrete code snippet demonstrating how to fix the issue."
            }
          },
          required: ["explanation", "fixSnippet"]
        }
      },
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    const explanation = data.explanation;
    const fixSnippet = data.fixSnippet;

    // Cache the result in the database
    await prisma.issue.update({
      where: { id: issueId },
      data: { explanation, fixSnippet },
    });

    return NextResponse.json({ explanation, fixSnippet });
  } catch (err) {
    console.error("Explain API failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `LLM call failed: ${err.message}`
            : "An unexpected error occurred generating the explanation",
      },
      { status: 500 }
    );
  }
}
