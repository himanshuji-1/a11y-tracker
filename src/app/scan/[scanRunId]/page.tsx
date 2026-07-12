import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import IssueTable from "@/components/IssueTable";
import DownloadReportButton from "@/components/DownloadReportButton";

interface PageProps {
  params: { scanRunId: string };
}

export default async function ScanDashboard({ params }: PageProps) {
  const scanRun = await prisma.scanRun.findUnique({
    where: { id: params.scanRunId },
    include: {
      site: true,
      issues: true,
    },
  });

  if (!scanRun) {
    notFound();
  }

  // Compute severity counts
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const issue of scanRun.issues) {
    if (issue.severity in counts) {
      counts[issue.severity as keyof typeof counts]++;
    }
  }

  // Score color
  const score = scanRun.score ?? 0;
  const scoreColor =
    score < 50 ? "text-red-400 border-red-500" : score < 80 ? "text-orange-400 border-orange-500" : "text-green-400 border-green-500";
  const scoreBg =
    score < 50 ? "bg-red-500/10" : score < 80 ? "bg-orange-500/10" : "bg-green-500/10";

  // Format date
  const scanDate = new Date(scanRun.startedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← New Scan
          </a>
          <span className="text-gray-700">/</span>
          <a href="/scans" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            History
          </a>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-400">Scan Results</span>
        </div>

        {/* Top Summary Bar */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Score circle */}
            <div
              className={`flex-shrink-0 w-20 h-20 rounded-full border-2 ${scoreColor} ${scoreBg} flex flex-col items-center justify-center`}
            >
              <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-[10px] text-gray-500 -mt-0.5">/100</span>
            </div>

            {/* Site info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-white truncate" title={scanRun.site.url}>
                {scanRun.site.url}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span>{scanRun.pagesScanned} page{scanRun.pagesScanned !== 1 ? "s" : ""} scanned</span>
                <span className="text-gray-700">•</span>
                <span>Scanned {scanDate}</span>
                <span className="text-gray-700">•</span>
                <span>{scanRun.issues.length} issue{scanRun.issues.length !== 1 ? "s" : ""} found</span>
              </div>
            </div>

            {/* Download PDF Report */}
            <div className="flex items-center gap-2 shrink-0">
              <DownloadReportButton scanRunId={scanRun.id} />
              <a
                href={`/statement/${scanRun.id}`}
                className="px-4 py-2 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Statement
              </a>
            </div>
          </div>

          {/* Severity stat chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
            <StatChip label="Critical" count={counts.critical} color="red" />
            <StatChip label="Serious" count={counts.serious} color="orange" />
            <StatChip label="Moderate" count={counts.moderate} color="yellow" />
            <StatChip label="Minor" count={counts.minor} color="gray" />
          </div>
        </div>

        {/* Issue Table */}
        <IssueTable issues={JSON.parse(JSON.stringify(scanRun.issues))} scanRunId={scanRun.id} />
      </div>
    </div>
  );
}

function StatChip({ label, count, color }: { label: string; count: number; color: string }) {
  const dotColors: Record<string, string> = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500",
  };
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 text-xs">
      <span className={`w-2 h-2 rounded-full ${dotColors[color]}`} />
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-200">{count}</span>
    </div>
  );
}
