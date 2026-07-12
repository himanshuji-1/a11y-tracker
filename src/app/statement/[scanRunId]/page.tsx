"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function StatementPage() {
  const params = useParams();
  const scanRunId = params.scanRunId as string;

  const [statementText, setStatementText] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatement = async (regenerate = false) => {
    if (regenerate) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanRunId, regenerate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate statement");
      } else {
        setStatementText(data.statementText);
      }
    } catch {
      setError("Network error — couldn't reach the statement API");
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = () => {
    if (confirm("Regenerating will overwrite your current edits. Continue?")) {
      fetchStatement(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(statementText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <a
            href={`/scan/${scanRunId}`}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Dashboard
          </a>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-400">Accessibility Statement</span>
        </div>

        <h1 className="text-xl font-semibold text-white mb-1">
          Accessibility Statement
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Auto-generated based on your scan results. Edit freely before publishing.
        </p>

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
            <svg
              className="animate-spin h-6 w-6 text-gray-400 mx-auto mb-3"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Generating accessibility statement...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button
              onClick={() => fetchStatement()}
              className="px-4 py-2 rounded-md bg-red-500/10 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              className="w-full h-80 bg-white/[0.03] border border-white/10 rounded-lg p-5 text-sm text-gray-200 font-serif leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50"
              spellCheck
            />

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>

              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-4 py-2 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {regenerating ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-600 mt-3">
              Paste this statement on your website&apos;s /accessibility page. Edit the
              placeholder email and company name before publishing.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
