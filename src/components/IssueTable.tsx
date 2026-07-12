"use client";

import { useState, useEffect } from "react";

interface Issue {
  id: string;
  scanRunId: string;
  pageUrl: string;
  wcagCriterion: string;
  severity: string;
  ruleId: string;
  description: string;
  htmlSnippet: string;
  status: string;
  firstDetected: string;
  lastVerified: string | null;
  explanation: string | null;
  fixSnippet: string | null;
}

interface ExplainData {
  explanation: string;
  fixSnippet: string;
}

interface Toast {
  id: string;
  type: "success" | "warning" | "error";
  message: string;
}

const SEVERITY_ORDER = ["critical", "serious", "moderate", "minor"] as const;
type Severity = (typeof SEVERITY_ORDER)[number];

const SEVERITY_COLORS: Record<Severity, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: "border-l-red-500", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  serious: { border: "border-l-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500" },
  moderate: { border: "border-l-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  minor: { border: "border-l-gray-500", bg: "bg-gray-500/10", text: "text-gray-400", dot: "bg-gray-500" },
};

const STATUS_CYCLE = ["not_started", "in_progress", "fixed", "verified"] as const;
const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  fixed: "Fixed",
  verified: "Verified",
};
const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-gray-700 text-gray-300",
  in_progress: "bg-blue-900/60 text-blue-300 border border-blue-500/40",
  fixed: "bg-purple-900/60 text-purple-300 border border-purple-500/40",
  verified: "bg-green-900/60 text-green-300 border border-green-500/40",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Toast component ──────────────────────────────────────────────────────────
function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all ${
            t.type === "success"
              ? "bg-green-950 border-green-500/30 text-green-300"
              : t.type === "warning"
              ? "bg-yellow-950 border-yellow-500/30 text-yellow-300"
              : "bg-red-950 border-red-500/30 text-red-300"
          }`}
        >
          {t.type === "success" ? "✓" : t.type === "warning" ? "⚠" : "✕"}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function IssueTable({ issues: initialIssues, scanRunId }: { issues: Issue[]; scanRunId: string }) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Per-issue explain state
  const [explainData, setExplainData] = useState<Record<string, ExplainData>>(() => {
    const initial: Record<string, ExplainData> = {};
    for (const issue of initialIssues) {
      if (issue.explanation && issue.fixSnippet) {
        initial[issue.id] = { explanation: issue.explanation, fixSnippet: issue.fixSnippet };
      }
    }
    return initial;
  });
  const [explainLoading, setExplainLoading] = useState<Set<string>>(new Set());
  const [explainErrors, setExplainErrors] = useState<Record<string, string>>({});
  const [explainExpanded, setExplainExpanded] = useState<Set<string>>(new Set());

  // Per-pageUrl rescan loading state
  const [rescanLoading, setRescanLoading] = useState<Set<string>>(new Set());

  // Auto-dismiss toasts after 5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const addToast = (type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Count issues by severity
  const counts: Record<string, number> = { all: issues.length };
  for (const sev of SEVERITY_ORDER) {
    counts[sev] = issues.filter((i) => i.severity === sev).length;
  }

  // Apply filters
  const filtered = issues.filter((issue) => {
    const matchesSeverity = activeFilter === "all" || issue.severity === activeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      issue.description.toLowerCase().includes(q) ||
      issue.ruleId.toLowerCase().includes(q) ||
      issue.pageUrl.toLowerCase().includes(q);
    return matchesSeverity && matchesSearch;
  });

  // Group by severity in order
  const grouped = SEVERITY_ORDER.map((sev) => ({
    severity: sev,
    issues: filtered.filter((i) => i.severity === sev),
  })).filter((g) => g.issues.length > 0);

  // All unique pageUrls that have at least one in-progress/fixed issue
  const pageUrlsWithWorkInProgress = new Set(
    issues.filter((i) => i.status !== "not_started").map((i) => i.pageUrl)
  );

  // ── Status cycle ─────────────────────────────────────────────────────────
  const cycleStatus = async (issueId: string, currentStatus: string) => {
    const currentIdx = STATUS_CYCLE.indexOf(currentStatus as (typeof STATUS_CYCLE)[number]);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: nextStatus } : i)));

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: currentStatus } : i)));
      }
    } catch {
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: currentStatus } : i)));
    }
  };

  // ── Re-verify page ────────────────────────────────────────────────────────
  const handleRescan = async (pageUrl: string) => {
    setRescanLoading((prev) => new Set(prev).add(pageUrl));

    try {
      const res = await fetch("/api/rescan-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanRunId, pageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast("error", data.error || "Re-scan failed — please try again.");
        return;
      }

      // Merge returned issues into state
      const updatedMap: Record<string, Issue> = {};
      for (const u of data.updatedIssues) {
        updatedMap[u.id] = u;
      }
      setIssues((prev) => prev.map((i) => (updatedMap[i.id] ? { ...i, ...updatedMap[i.id] } : i)));

      // Show result toast
      if (data.verifiedCount > 0 && data.stillOpenCount === 0) {
        addToast("success", `✓ All ${data.verifiedCount} issue${data.verifiedCount > 1 ? "s" : ""} verified as fixed on this page!`);
      } else if (data.verifiedCount > 0) {
        addToast("success", `✓ ${data.verifiedCount} issue${data.verifiedCount > 1 ? "s" : ""} verified as fixed. ${data.stillOpenCount} still open.`);
      } else {
        addToast("warning", `Issues still present on this page — check your fix and try again.`);
      }
    } catch {
      addToast("error", "Network error — couldn't reach the re-scan API.");
    } finally {
      setRescanLoading((prev) => {
        const next = new Set(prev);
        next.delete(pageUrl);
        return next;
      });
    }
  };

  // ── Explain fix ───────────────────────────────────────────────────────────
  const handleExplain = async (issueId: string) => {
    if (explainData[issueId]) {
      setExplainExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(issueId)) {
          next.delete(issueId);
        } else {
          next.add(issueId);
        }
        return next;
      });
      return;
    }

    setExplainLoading((prev) => new Set(prev).add(issueId));
    setExplainErrors((prev) => {
      const next = { ...prev };
      delete next[issueId];
      return next;
    });

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExplainErrors((prev) => ({ ...prev, [issueId]: data.error || "Failed to generate explanation" }));
      } else {
        setExplainData((prev) => ({
          ...prev,
          [issueId]: { explanation: data.explanation, fixSnippet: data.fixSnippet },
        }));
        setExplainExpanded((prev) => new Set(prev).add(issueId));
      }
    } catch {
      setExplainErrors((prev) => ({
        ...prev,
        [issueId]: "Network error — couldn't reach the explanation API",
      }));
    } finally {
      setExplainLoading((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  if (issues.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-green-500/30 bg-green-500/5 p-8 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <h3 className="text-lg font-semibold text-green-400">No accessibility issues detected!</h3>
        <p className="text-sm text-gray-400 mt-1">This site passed all WCAG checks that were run.</p>
      </div>
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="mt-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {["all", ...SEVERITY_ORDER].map((filter) => {
            const isActive = activeFilter === filter;
            const label = filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1);
            const sev = filter as Severity;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white ring-1 ring-white/20"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                {filter !== "all" && (
                  <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[sev]?.dot || ""}`} />
                )}
                {label} ({counts[filter] || 0})
              </button>
            );
          })}

          <div className="ml-auto">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 w-56"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Showing {filtered.length} of {issues.length} issues
        </p>

        {/* Issue groups */}
        {grouped.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No issues match your filter.</div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const colors = SEVERITY_COLORS[group.severity];

              // Find unique pageURLs in this severity group
              const pageUrls = Array.from(new Set(group.issues.map((i) => i.pageUrl)));

              return (
                <div key={group.severity}>
                  {/* Group header */}
                  <div className={`flex items-center gap-2 mb-2 pl-3 border-l-2 ${colors.border}`}>
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                      {group.severity}
                    </span>
                    <span className="text-xs text-gray-600">({group.issues.length})</span>
                  </div>

                  {/* Sub-group by pageUrl */}
                  {pageUrls.map((pageUrl) => {
                    const pageIssues = group.issues.filter((i) => i.pageUrl === pageUrl);
                    const hasWorkInProgress = pageUrlsWithWorkInProgress.has(pageUrl);
                    const isRescanning = rescanLoading.has(pageUrl);

                    return (
                      <div key={pageUrl} className="mb-3">
                        {/* Page URL header + Re-verify button */}
                        <div className="flex items-center justify-between px-3 py-1.5 mb-1 rounded-md bg-white/[0.015] border border-white/5">
                          <span className="text-[11px] text-gray-500 font-mono truncate max-w-xs" title={pageUrl}>
                            {pageUrl}
                          </span>
                          {hasWorkInProgress && (
                            <button
                              onClick={() => handleRescan(pageUrl)}
                              disabled={isRescanning}
                              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors disabled:opacity-50 shrink-0 ml-3"
                            >
                              {isRescanning ? (
                                <>
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Re-checking...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Re-verify this page
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Issues on this page */}
                        <div className="space-y-1 pl-0">
                          {pageIssues.map((issue) => (
                            <IssueRow
                              key={issue.id}
                              issue={issue}
                              colors={colors}
                              onCycleStatus={cycleStatus}
                              onExplain={handleExplain}
                              isExplainLoading={explainLoading.has(issue.id)}
                              explainData={explainData[issue.id] || null}
                              explainError={explainErrors[issue.id] || null}
                              isExplainExpanded={explainExpanded.has(issue.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function IssueRow({
  issue,
  colors,
  onCycleStatus,
  onExplain,
  isExplainLoading,
  explainData,
  explainError,
  isExplainExpanded,
}: {
  issue: Issue;
  colors: { border: string; bg: string; text: string; dot: string };
  onCycleStatus: (id: string, status: string) => void;
  onExplain: (id: string) => void;
  isExplainLoading: boolean;
  explainData: ExplainData | null;
  explainError: string | null;
  isExplainExpanded: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  let explainLabel = "Explain fix →";
  if (isExplainLoading) {
    explainLabel = "Explaining...";
  } else if (explainData && isExplainExpanded) {
    explainLabel = "Hide explanation";
  } else if (explainData) {
    explainLabel = "Show explanation";
  }

  return (
    <div className={`border-l-2 ${colors.border} bg-white/[0.02] hover:bg-white/[0.04] rounded-r-md transition-colors`}>
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/10 text-gray-300 shrink-0">
              WCAG {issue.wcagCriterion}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">{issue.ruleId}</span>
          </div>

          <p className="text-sm text-gray-200 mt-1 leading-tight">{issue.description}</p>

          <details className="mt-1.5 group">
            <summary className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer select-none">
              View HTML snippet
            </summary>
            <pre className="mt-1 p-2 bg-black/40 rounded text-[11px] text-gray-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
              {issue.htmlSnippet}
            </pre>
          </details>
        </div>

        {/* Right side: status + explain */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => onCycleStatus(issue.id, issue.status)}
            className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${STATUS_STYLES[issue.status] || STATUS_STYLES.not_started}`}
            title="Click to cycle status"
          >
            {STATUS_LABELS[issue.status] || "Not Started"}
          </button>

          {/* Verified timestamp — audit trail proof point */}
          {issue.status === "verified" && issue.lastVerified && (
            <span className="text-[9px] text-green-500/70 text-right leading-tight">
              Verified {formatDate(issue.lastVerified)}
            </span>
          )}

          <button
            onClick={() => onExplain(issue.id)}
            disabled={isExplainLoading}
            className={`text-[10px] transition-colors ${
              isExplainLoading
                ? "text-yellow-500 animate-pulse"
                : explainData
                ? "text-blue-400 hover:text-blue-300"
                : "text-gray-500 hover:text-blue-400"
            }`}
          >
            {explainLabel}
          </button>
        </div>
      </div>

      {/* Explanation panel */}
      {isExplainExpanded && explainData && (
        <div className="mx-3 mb-3 mt-1 p-3 rounded-md bg-blue-950/30 border border-blue-500/10">
          <div className="mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              Why this matters
            </span>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{explainData.explanation}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
                Suggested fix
              </span>
              <button
                onClick={() => copyToClipboard(explainData.fixSnippet)}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 bg-black/50 rounded text-[11px] text-green-300/80 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
              <code>{explainData.fixSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Error state */}
      {explainError && (
        <div className="mx-3 mb-3 mt-1 p-2.5 rounded-md bg-red-950/30 border border-red-500/10 flex items-center justify-between">
          <span className="text-xs text-red-400">{explainError}</span>
          <button
            onClick={() => onExplain(issue.id)}
            className="text-[10px] text-red-400 hover:text-red-300 underline ml-3 shrink-0"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
