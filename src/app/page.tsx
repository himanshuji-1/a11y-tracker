"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Shared micro-components ─────────────────────────────────────────────── */

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ color: "var(--color-accent)" }}>
      <path
        d="M10 2L3 5v5c0 3.87 2.97 7.49 7 8.93C14.03 17.49 17 13.87 17 10V5L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 10l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Mock dashboard card (decorative, aria-hidden) ────────────────────────── */

function MockDashboardCard() {
  const issues = [
    { severity: "critical", label: "Images missing alt text", wcag: "1.1.1" },
    { severity: "serious",  label: "Low contrast ratio on body text", wcag: "1.4.3" },
    { severity: "moderate", label: "Form inputs lack visible labels", wcag: "1.3.1" },
  ];
  const severityColor: Record<string, string> = {
    critical: "#f87171",
    serious:  "#fb923c",
    moderate: "#facc15",
  };
  const severityBg: Record<string, string> = {
    critical: "rgba(248,113,113,0.08)",
    serious:  "rgba(251,146,60,0.08)",
    moderate: "rgba(250,204,21,0.08)",
  };

  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-card)",
        padding: "20px",
        width: "100%",
        maxWidth: "380px",
        fontFamily: "var(--font-family)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            animepahe.ch
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            4 pages · scanned just now
          </div>
        </div>
        {/* Score circle */}
        <div style={{
          width: "52px", height: "52px",
          borderRadius: "50%",
          background: "conic-gradient(#fb923c 0% 28%, rgba(186,215,247,0.08) 28% 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "var(--color-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 700, color: "#fb923c",
          }}>
            72
          </div>
        </div>
      </div>

      {/* Severity counts */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "8px", marginBottom: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--color-border)",
      }}>
        {[
          { dot: "#f87171", label: "Critical", count: 3 },
          { dot: "#fb923c", label: "Serious",  count: 8 },
          { dot: "#facc15", label: "Moderate", count: 5 },
          { dot: "#94a3b8", label: "Minor",    count: 2 },
        ].map(({ dot, label, count }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: dot }}>{count}</div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Issue rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {issues.map((issue) => (
          <div key={issue.label} style={{
            background: severityBg[issue.severity],
            border: `1px solid ${severityColor[issue.severity]}22`,
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}>
            <span style={{
              display: "inline-block",
              width: "6px", height: "6px",
              borderRadius: "50%",
              background: severityColor[issue.severity],
              flexShrink: 0,
              marginTop: "5px",
            }} />
            <div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                {issue.label}
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                WCAG {issue.wcag} · <span style={{ textTransform: "capitalize" }}>{issue.severity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verified badge */}
      <div style={{
        marginTop: "14px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        color: "#4ade80",
        borderTop: "1px solid var(--color-border)",
        paddingTop: "12px",
      }}>
        <CheckCircleIcon className="w-3 h-3" />
        2 issues verified fixed after last re-scan
      </div>
    </div>
  );
}

/* ── Scan input + button ─────────────────────────────────────────────────── */

interface ScanInputProps {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  onScan: () => void;
  error: string | null;
}

function ScanInput({ url, setUrl, loading, onScan, error }: ScanInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) onScan();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--color-surface-2)",
          border: `1px solid ${error ? "rgba(248,113,113,0.35)" : "var(--color-border-strong)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "5px 5px 5px 14px",
          boxShadow: "var(--shadow-input)",
          transition: `border-color ${150}ms ease`,
        }}
      >
        <label htmlFor="site-url" className="sr-only">
          Website URL to scan
        </label>
        <input
          id="site-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://yourwebsite.com"
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "var(--font-size-md)",
            color: "var(--color-text-primary)",
            caretColor: "var(--color-accent)",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={onScan}
          disabled={loading || !url.trim()}
          aria-label={loading ? "Scanning in progress…" : "Start accessibility scan"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "7px",
            background: loading || !url.trim() ? "rgba(76,142,255,0.25)" : "var(--color-accent)",
            color: loading || !url.trim() ? "rgba(255,255,255,0.4)" : "#fff",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            fontFamily: "var(--font-family)",
            border: "none",
            cursor: loading || !url.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: `background ${150}ms ease, color ${150}ms ease`,
            boxShadow: !loading && url.trim() ? "var(--shadow-button)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!loading && url.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent-hover)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && url.trim()) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-accent)";
            }
          }}
        >
          {loading ? (
            <>
              <svg
                style={{ animation: "spin 0.8s linear infinite", width: "14px", height: "14px" }}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning…
            </>
          ) : (
            "Scan site →"
          )}
        </button>
      </div>

      {/* Hint */}
      <p style={{
        marginTop: "10px",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-muted)",
        paddingLeft: "2px",
      }}>
        Scans take 5–15 seconds — homepage plus linked internal pages.
      </p>

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: "12px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-error-dim)",
            border: "1px solid rgba(248,113,113,0.25)",
          }}
        >
          <svg style={{ width: "14px", height: "14px", color: "var(--color-error)", flexShrink: 0, marginTop: "1px" }} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.5a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75 2.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-error)" }}>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const targetUrl =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed — check the URL and try again.");
        setLoading(false);
        return;
      }
      router.push(`/scan/${data.id}`);
    } catch {
      setError("Network error — couldn't reach the scan API. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: "56px",
          background: "rgba(5,6,15,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldIcon className="w-5 h-5" />
          <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, letterSpacing: "-0.3px", color: "var(--color-text-primary)" }}>
            a11y<span style={{ color: "var(--color-accent)" }}>-tracker</span>
          </span>
        </div>

        {/* Right nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link
            href="/scans"
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              transition: `color ${150}ms ease`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            Recent Scans
          </Link>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(76,142,255,0.25)",
            background: "rgba(76,142,255,0.08)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 500,
            color: "var(--color-accent)",
            letterSpacing: "0.01em",
          }}>
            WCAG 2.1 / 2.2 AA
          </span>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main id="main-content">
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "72px 32px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "center",
          }}
          className="hero-section"
        >
          {/* Left column */}
          <div className="animate-fade-in-up">
            {/* Alert chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(248,113,113,0.25)",
                background: "rgba(248,113,113,0.07)",
                fontSize: "var(--font-size-xs)",
                fontWeight: 500,
                color: "#f87171",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#f87171",
                }}
                className="animate-pulse-soft"
              />
              5,000+ ADA lawsuits filed in 2025. Overlay widgets aren&apos;t a defence.
            </div>

            {/* H1 */}
            <h1
              style={{
                fontSize: "clamp(32px, 4vw, 44px)",
                fontWeight: 800,
                lineHeight: 1.13,
                letterSpacing: "-1.2px",
                color: "var(--color-text-primary)",
                marginBottom: "20px",
                textWrap: "balance",
              }}
            >
              Real accessibility fixes,{" "}
              <span style={{ color: "var(--color-accent)" }}>not another overlay widget.</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: "var(--font-size-lg)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.65,
                marginBottom: "32px",
                maxWidth: "480px",
              }}
            >
              Scan any website for WCAG 2.1/2.2 AA issues, get AI-generated code fixes,
              track genuine remediation with timestamps, and generate the compliance
              documentation your legal team actually needs.
            </p>

            {/* Scan input */}
            <ScanInput
              url={url}
              setUrl={setUrl}
              loading={loading}
              onScan={handleScan}
              error={error}
            />

            {/* Social proof row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginTop: "28px",
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: "✓", label: "axe-core engine" },
                { icon: "✓", label: "Gemini AI fixes" },
                { icon: "✓", label: "PDF compliance report" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — Mock card */}
          <div
            className="animate-fade-in-up delay-300"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <MockDashboardCard />
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--color-border)", maxWidth: "1100px", margin: "0 auto" }} />

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <section
          aria-label="Key statistics"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 32px",
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            gap: "0",
            alignItems: "center",
          }}
        >
          {[
            { stat: "94.8%", caption: "of websites fail basic accessibility checks" },
            null,
            { stat: "5,000+", caption: "ADA digital accessibility lawsuits filed in 2025" },
            null,
            { stat: "22%", caption: "of 2025 lawsuits targeted sites already using overlay widgets" },
          ].map((item, i) => {
            if (item === null) {
              return (
                <div
                  key={`divider-${i}`}
                  style={{ width: "1px", height: "48px", background: "var(--color-border)", margin: "0 auto" }}
                />
              );
            }
            return (
              <div key={item.stat} style={{ textAlign: "center", padding: "0 32px" }}>
                <div
                  style={{
                    fontSize: "clamp(28px, 3vw, 40px)",
                    fontWeight: 800,
                    color: "var(--color-text-primary)",
                    letterSpacing: "-1px",
                    lineHeight: 1,
                    marginBottom: "8px",
                  }}
                >
                  {item.stat}
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: 1.5, maxWidth: "160px", margin: "0 auto" }}>
                  {item.caption}
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--color-border)", maxWidth: "1100px", margin: "0 auto" }} />

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section
          aria-labelledby="how-it-works-heading"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "72px 32px",
          }}
        >
          <div style={{ marginBottom: "48px" }}>
            <span style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              display: "block",
              marginBottom: "12px",
            }}>
              How it works
            </span>
            <h2
              id="how-it-works-heading"
              style={{
                fontSize: "clamp(22px, 2.5vw, 30px)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.6px",
                lineHeight: 1.2,
              }}
            >
              From URL to compliance documentation in minutes.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0",
            }}
            className="how-it-works-grid"
          >
            {[
              {
                num: "01",
                title: "Scan",
                description: "Paste a URL. We crawl your homepage and linked pages, then run a real axe-core WCAG audit across all of them.",
              },
              {
                num: "02",
                title: "Diagnose",
                description: "Every violation is scored by severity, mapped to its exact WCAG criterion, and shown with the failing HTML snippet.",
              },
              {
                num: "03",
                title: "Fix",
                description: "Click \"Explain fix\" on any issue. Gemini AI explains who it affects and generates a working code snippet to resolve it.",
              },
              {
                num: "04",
                title: "Prove",
                description: "After fixing, trigger a live re-scan. Resolved issues are automatically marked Verified with a timestamp — a genuine audit trail.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                style={{
                  padding: "28px 28px 28px 0",
                  borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
                  paddingLeft: i > 0 ? "28px" : "0",
                }}
              >
                <div style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 700,
                  color: "var(--color-accent)",
                  marginBottom: "12px",
                  letterSpacing: "0.05em",
                }}>
                  {step.num}
                </div>
                <div style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "10px",
                  letterSpacing: "-0.2px",
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.65,
                }}>
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--color-border)", maxWidth: "1100px", margin: "0 auto" }} />

        {/* ── Why not a widget ─────────────────────────────────────────── */}
        <section
          aria-labelledby="widget-problem-heading"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "72px 32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "64px",
            alignItems: "start",
          }}
          className="two-col-section"
        >
          <div>
            <span style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fb923c",
              display: "block",
              marginBottom: "12px",
            }}>
              The widget problem
            </span>
            <h2
              id="widget-problem-heading"
              style={{
                fontSize: "clamp(20px, 2vw, 26px)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.5px",
                lineHeight: 1.3,
                marginBottom: "16px",
              }}
            >
              Courts have ruled overlay widgets don&apos;t constitute legal compliance.
            </h2>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", lineHeight: 1.75 }}>
              Widgets modify pages in the visitor&apos;s browser without touching the underlying code.
              The accessibility barrier is still there in your source. In 2025, the FTC fined a
              leading widget company <strong style={{ color: "var(--color-text-secondary)" }}>$1 million</strong> for
              falsely marketing their product as a compliance solution.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { icon: "✗", color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)", text: "Overlay widgets — mask violations in the browser, source code stays broken" },
              { icon: "✓", color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.2)", text: "a11y-tracker — surfaces real violations in source code with timestamped proof of remediation" },
            ].map(({ icon, color, bg, border, text }) => (
              <div
                key={icon}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: bg,
                  border: `1px solid ${border}`,
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 700, color, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--color-border)", maxWidth: "1100px", margin: "0 auto" }} />

        {/* ── CTA section ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="cta-heading"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "80px 32px 96px",
            textAlign: "center",
          }}
        >
          <h2
            id="cta-heading"
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.8px",
              marginBottom: "14px",
            }}
          >
            Stop guessing. Start fixing.
          </h2>
          <p style={{
            fontSize: "var(--font-size-lg)",
            color: "var(--color-text-muted)",
            marginBottom: "36px",
            maxWidth: "440px",
            margin: "0 auto 36px",
          }}>
            Paste your site URL and get a full WCAG report in under 15 seconds.
          </p>
          <div style={{ maxWidth: "520px", margin: "0 auto" }}>
            <ScanInput
              url={url}
              setUrl={setUrl}
              loading={loading}
              onScan={handleScan}
              error={null}
            />
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
          a11y-tracker — automated WCAG 2.1/2.2 AA scanning via axe-core
        </span>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link
            href="/scans"
            style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            Recent Scans
          </Link>
        </div>
      </footer>

    </div>
  );
}
