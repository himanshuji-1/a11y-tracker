# a11y-tracker

**Real accessibility fixes, not another overlay widget.**

a11y-tracker is a web accessibility compliance tool that scans any website for real WCAG 2.1/2.2 AA violations, explains each issue in plain English with an AI-generated code fix, tracks genuine code-level remediation over time, and generates the legal documentation (compliance reports + accessibility statements) that businesses actually need when facing ADA lawsuits or demand letters.

---

## The Problem

- **5,000+** ADA digital accessibility lawsuits were filed in the US in 2025 alone, and the number is rising year over year.
- **94.8%** of websites fail basic accessibility checks.
- Businesses have turned to "accessibility overlay widgets" (accessiBe, UserWay, etc.) as a quick fix — but **22% of 2025 lawsuits specifically targeted sites that already had a widget installed.**
- The FTC fined accessiBe **$1 million** in 2025 for falsely marketing overlay widgets as a compliance solution. Courts have consistently ruled that widgets do not constitute good-faith remediation — they patch the DOM in the browser without fixing the underlying source code.

Businesses need real fixes and real documentation, not a script tag that hides the problem.

## What a11y-tracker Does

1. **Scan** — paste any URL. a11y-tracker crawls the homepage plus linked internal pages and runs a real `axe-core` audit against WCAG 2.1 and 2.2 Level AA success criteria.
2. **Diagnose** — every violation is scored by severity (critical/serious/moderate/minor), mapped to its specific WCAG criterion, and shown with the actual failing HTML — not a vague summary.
3. **Explain** — click "Explain fix" on any issue and Gemini generates a plain-English explanation of who's affected and why, plus a working code snippet to fix it.
4. **Track** — every issue has a status (Not Started → In Progress → Fixed → Verified) with real timestamps. Re-scan a page after making a fix, and issues that are actually resolved get automatically marked "Verified" with a `lastVerified` date — a genuine audit trail, not a one-time report.
5. **Document** — auto-generate a publishable accessibility statement and a full PDF compliance report, timestamped and ready to hand to legal counsel, a client, or a regulator as evidence of active, ongoing remediation.

## Why This, Not a Widget

Overlay widgets modify the page in the visitor's browser without touching the underlying code — the accessibility barrier is still there for anyone the widget doesn't handle correctly, and courts have started treating widget installation as evidence a business *knew* about its accessibility problems but chose a cheap fix. a11y-tracker instead surfaces real WCAG violations in the actual source, tracks genuine code-level remediation with timestamps, and produces documentation that reflects real, defensible effort.

---

## Features

| Feature | Status |
|---|---|
| Multi-page WCAG 2.1/2.2 AA scanning (axe-core) | ✅ |
| Severity-scored issue dashboard with filtering & search | ✅ |
| AI-powered plain-English fix explanations + code snippets | ✅ |
| Fix status tracking (Not Started → In Progress → Fixed → Verified) | ✅ |
| Automated re-scan verification with timestamped audit trail | ✅ |
| Auto-generated, editable accessibility statement | ✅ |
| Downloadable PDF compliance report | ✅ |
| Scan history across multiple sites | ✅ |
| User accounts & multi-tenant organizations | 🚧 In progress |
| Stripe subscription billing (Free / Starter / Pro tiers) | 🚧 In progress |
| Scheduled automatic re-scans + email digests | 📋 Planned |
| VPAT / ACR generation for procurement compliance | 📋 Planned |
| CI/CD integration (GitHub Action / CLI) | 📋 Planned |
| Shopify App Store listing | 📋 Planned |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL on Neon via Prisma ORM
- **Scanning engine:** Puppeteer / Browserless + [`axe-core`](https://github.com/dequelabs/axe-core)
- **AI:** Google Gemini API — fix explanations and accessibility statement generation
- **PDF generation:** Puppeteer print-to-PDF from a dedicated print-friendly route
- **Auth (in progress):** Clerk
- **Billing (in progress):** Stripe

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js)                           │
│  - Landing page → URL scan input              │
│  - Scan dashboard (issues, filters, status)   │
│  - Accessibility statement editor             │
│  - Scan history                               │
└───────────────┬───────────────────────────────┘
                │ REST API (Next.js API routes)
┌───────────────▼───────────────────────────────┐
│  Backend (Next.js API routes)                 │
│  /api/scan          → Puppeteer + axe-core      │
│  /api/rescan-page   → verification re-scan      │
│  /api/issues/[id]   → status updates            │
│  /api/explain       → Gemini fix explanations   │
│  /api/statement     → Gemini statement drafting │
│  /api/report/[id]   → PDF generation            │
│  /api/scans         → scan history              │
└───────────────┬───────────────────────────────┘
                │
┌───────────────▼───────────────────────────────┐
│  Database: PostgreSQL (Prisma)                 │
│  Site → ScanRun → Issue                        │
└────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com/))
- A Browserless API Key for remote browser instances ([browserless.io](https://www.browserless.io/))
- A PostgreSQL database (e.g. [Neon](https://neon.tech/))

### Setup

```bash
# clone and install
git clone https://github.com/himanshuji-1/a11y-tracker.git
cd a11y-tracker
npm install

# set up environment variables
cp .env.example .env.local
```

Fill in `.env.local`:

```
GEMINI_API_KEY=your_key_here
BROWSERLESS_TOKEN=your_browserless_token
DATABASE_URL="postgresql://user:password@endpoint..."

# only needed once auth/billing land:
# CLERK_SECRET_KEY=
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_PRICE_STARTER=
# STRIPE_PRICE_PRO=
```

```bash
# run database migrations
npx prisma generate
npx prisma db push

# start the dev server
npm run dev
```

Visit `http://localhost:3000`, paste in a URL, and scan.

---

## Roadmap to Production SaaS

This was built as a hackathon MVP. The path to a real subscription product:

1. **Auth + multi-tenancy + Stripe billing** — accounts, organizations, and Free/Starter/Pro plan gating.
2. **Scheduled re-scans + email digests** — the feature that turns a one-time scan into a recurring subscription.
3. **Distribution** — Shopify App Store listing, a free public "scan grader" tool for organic growth, and an agency white-label/referral program.
4. **Deeper differentiation** — VPAT/ACR generation for government procurement, a manual audit layer to supplement automated scanning, and CI/CD integration so teams catch regressions before they ship.

---

## Disclaimer

a11y-tracker performs automated accessibility testing via `axe-core`, which — like all automated tools — cannot catch every WCAG success criterion (things like meaningful reading order or genuinely descriptive alt text still require human review). This tool is meant to support, not replace, a full manual accessibility audit and legal counsel where compliance risk is a concern.

---

## License

MIT (or update to your preferred license)

## Team

Built by Himanshu at [Hackathon Name], July 2026.
