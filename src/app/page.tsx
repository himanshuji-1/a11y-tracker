"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Auto-prefix https:// if missing
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
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col">
      {/* Nav bar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Shield icon */}
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-white tracking-tight">
            a11y<span className="text-blue-400">-tracker</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <a href="/scans" className="text-blue-400 hover:text-blue-300 transition-colors hidden sm:inline">Recent Scans</a>
          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            WCAG 2.1 / 2.2 AA
          </span>
          <span className="text-gray-500 hidden sm:inline">Powered by axe-core + Gemini AI</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        {/* Subtle radial glow behind the hero */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse at center, #3b82f6 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-3xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            94.8% of websites fail basic accessibility checks
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight mb-5">
            Real accessibility fixes,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              not another overlay widget.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Scan any website for WCAG 2.1/2.2 AA issues, track real code-level remediation,
            and generate the compliance documentation your legal team actually needs.
          </p>

          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleScan(); }}
              placeholder="https://yourwebsite.com"
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 disabled:opacity-60 transition-colors"
            />
            <button
              onClick={handleScan}
              disabled={loading || !url.trim()}
              className="px-7 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </>
              ) : (
                "Scan Now →"
              )}
            </button>
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-600 mb-3">
            Scans take 5–15 seconds — we check your homepage plus linked pages.
          </p>

          {/* Inline error */}
          {error && (
            <div className="mt-3 mx-auto max-w-xl flex items-start gap-2.5 p-3.5 rounded-lg bg-red-500/8 border border-red-500/20 text-left">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="relative z-10 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mx-auto px-4">
          {[
            { stat: "94.8%", caption: "of websites fail basic accessibility checks" },
            { stat: "5,000+", caption: "ADA digital accessibility lawsuits filed in 2025" },
            { stat: "22%", caption: "of 2025 lawsuits targeted sites already using overlay widgets" },
          ].map(({ stat, caption }) => (
            <div
              key={stat}
              className="rounded-xl border border-white/8 bg-white/[0.025] p-5 text-center hover:bg-white/[0.04] transition-colors"
            >
              <div className="text-3xl font-bold text-white mb-1.5">{stat}</div>
              <div className="text-xs text-gray-500 leading-snug">{caption}</div>
            </div>
          ))}
        </div>

        {/* Differentiator section */}
        <div className="relative z-10 mt-12 max-w-2xl mx-auto px-4">
          <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Why not a widget?
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Overlay widgets don&apos;t fix underlying code — they mask violations at the DOM
              level while leaving the real issues intact, and courts have ruled they don&apos;t
              constitute good-faith compliance efforts. a11y-tracker finds real WCAG violations
              in your actual source code, tracks genuine remediation with timestamps and status,
              and generates the compliance reports and accessibility statements that demonstrate
              documented, ongoing effort — the standard legal teams and regulators actually look for.
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-2 px-4">
          {[
            { color: "bg-red-500", label: "Critical issue detection" },
            { color: "bg-orange-500", label: "AI-powered fix explanations" },
            { color: "bg-blue-500", label: "PDF compliance report" },
            { color: "bg-purple-500", label: "Accessibility statement generator" },
            { color: "bg-green-500", label: "Remediation tracking" },
          ].map(({ color, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs text-gray-400"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-gray-600">
        a11y-tracker — automated WCAG 2.1/2.2 AA scanning via axe-core
      </footer>
    </div>
  );
}
