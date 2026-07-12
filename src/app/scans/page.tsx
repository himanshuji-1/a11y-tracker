"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScanRun {
  id: string;
  siteId: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  pagesScanned: number;
  statementText: string | null;
  site: {
    id: string;
    url: string;
  };
  _count: {
    issues: number;
  };
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScans() {
      try {
        const res = await fetch("/api/scans");
        if (!res.ok) throw new Error("Failed to load scans");
        const data = await res.json();
        setScans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchScans();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500 border-gray-500/30 bg-gray-500/10";
    if (score < 50) return "text-red-400 border-red-500/30 bg-red-500/10";
    if (score < 80) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    return "text-green-400 border-green-500/30 bg-green-500/10";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col">
      {/* Nav bar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-white tracking-tight group-hover:text-gray-200 transition-colors">
            a11y<span className="text-blue-400 group-hover:text-blue-300 transition-colors">-tracker</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/scans" className="text-blue-400 px-3 py-1.5 bg-blue-500/10 rounded-md">Recent Scans</Link>
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">New Scan</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Scan History</h1>
            <p className="text-sm text-gray-400">View and manage previous accessibility scans across all domains.</p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            + Run New Scan
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-blue-500">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No scans yet</h3>
            <p className="text-sm text-gray-500 mb-6">Run your first accessibility scan to see it here.</p>
            <Link href="/" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
              Go to scanner
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Site</th>
                  <th className="px-6 py-4 font-semibold text-center">Score</th>
                  <th className="px-6 py-4 font-semibold text-center">Issues</th>
                  <th className="px-6 py-4 font-semibold text-right">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-200 truncate max-w-xs" title={scan.site.url}>
                          {new URL(scan.site.url).hostname}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-xs">{scan.site.url}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-full border text-xs font-bold ${getScoreColor(scan.score)}`}>
                        {scan.score !== null ? scan.score : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300">
                      {scan._count.issues}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
                      {new Date(scan.startedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/scan/${scan.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium text-xs px-3 py-1.5 rounded-md hover:bg-blue-500/10 transition-colors"
                      >
                        View Report →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
