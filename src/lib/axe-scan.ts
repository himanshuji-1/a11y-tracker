import puppeteer, { Browser } from "puppeteer";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AxeNode {
  html: string;
}

export interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  tags: string[];
  nodes: AxeNode[];
}

export interface AxeResults {
  violations: AxeViolation[];
}

export interface PageScanResult {
  pageUrl: string;
  violations: AxeViolation[];
}

// ── WCAG criterion extractor ───────────────────────────────────────────────
// e.g. "wcag143" -> "1.4.3", "wcag2111" -> "2.1.11"
export function extractWcagCriterion(tags: string[]): string {
  const wcagTag = tags.find((t) => /^wcag\d{3,4}$/.test(t));
  if (!wcagTag) return "unknown";

  const digits = wcagTag.replace("wcag", "");
  if (digits.length === 3) {
    return `${digits[0]}.${digits[1]}.${digits[2]}`;
  } else if (digits.length === 4) {
    return `${digits[0]}.${digits[1]}.${digits.slice(2)}`;
  }
  return "unknown";
}

// ── Single-page axe-core scan ──────────────────────────────────────────────
// Navigates to a URL using an existing Puppeteer page, injects axe-core,
// runs it with the standard WCAG tag set, and returns violations.
export async function scanPageWithAxe(
  page: Awaited<ReturnType<Browser["newPage"]>>,
  pageUrl: string,
  axeSource: string
): Promise<AxeViolation[]> {
  await page.goto(pageUrl, {
    timeout: 15000,
    waitUntil: "domcontentloaded",
  });

  await page.evaluate(axeSource);

  const results: AxeResults = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
  });

  return results.violations;
}

// ── Fetch axe-core source from CDN ─────────────────────────────────────────
export async function readAxeSource(): Promise<string> {
  const res = await fetch("https://unpkg.com/axe-core@4.12.1/axe.min.js", {
    cache: "force-cache"
  });
  if (!res.ok) {
    throw new Error("Failed to load axe-core from CDN");
  }
  return res.text();
}

// ── Launch Puppeteer with standard args ────────────────────────────────────
export async function launchBrowser(): Promise<Browser> {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;

  if (browserlessToken) {
    console.log("Connecting to Browserless...");
    return puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`,
    });
  }

  console.log("Launching local Puppeteer...");
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
