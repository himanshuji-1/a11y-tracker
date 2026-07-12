import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: { scanRunId: string };
}

export default async function ReportPrintPage({ params }: PageProps) {
  const scanRun = await prisma.scanRun.findUnique({
    where: { id: params.scanRunId },
    include: {
      site: true,
      issues: {
        orderBy: [
          { severity: 'asc' }, // Will sort alphabetically, we'll group manually
        ]
      },
    },
  });

  if (!scanRun) {
    notFound();
  }

  // Group issues by severity in specific order
  const SEVERITY_ORDER = ["critical", "serious", "moderate", "minor"] as const;
  
  const groupedIssues = SEVERITY_ORDER.map(severity => ({
    severity,
    issues: scanRun.issues.filter(i => i.severity === severity)
  })).filter(g => g.issues.length > 0);

  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const issue of scanRun.issues) {
    if (issue.severity in counts) {
      counts[issue.severity as keyof typeof counts]++;
    }
  }

  const scanDate = new Date(scanRun.startedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          color: #000 !important;
          background: #fff !important;
          line-height: 1.5 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 12px !important;
        }
        .container {
          max-width: 100%;
          margin: 0 auto;
        }
        header {
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        .meta {
          color: #555;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .summary-table th, .summary-table td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: left;
        }
        .summary-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .methodology {
          margin-bottom: 40px;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #333;
        }
        .severity-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .severity-header {
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          padding: 5px 0;
          border-bottom: 1px solid #000;
          margin-bottom: 15px;
        }
        .issues-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .issues-table th, .issues-table td {
          border: 1px solid #ddd;
          padding: 8px;
          vertical-align: top;
        }
        .issues-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: left;
        }
        .issue-row {
          page-break-inside: avoid;
        }
        .explanation-row td {
          background-color: #fafafa;
          border-top: none;
          padding-top: 0;
          padding-bottom: 15px;
        }
        .explanation-box {
          padding: 10px;
          background: #fff;
          border: 1px solid #eee;
          margin-top: 5px;
        }
        .explanation-label {
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 4px;
        }
        code {
          font-family: monospace;
          background-color: #f4f4f4;
          padding: 2px 4px;
          font-size: 11px;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border: 1px solid #ddd;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 11px;
        }
        .status {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
        }
        footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ccc;
          text-align: center;
          color: #777;
          font-size: 10px;
          page-break-after: avoid;
        }
        @page {
          margin: 40px 30px;
        }
      `}} />
      <div className="container">
        <header>
          <h1>Accessibility Compliance Report</h1>
          <div className="meta"><strong>Site:</strong> {scanRun.site.url}</div>
          <div className="meta"><strong>Scan Date:</strong> {scanDate}</div>
          <div className="meta" style={{marginTop: '10px', fontSize: '12px'}}>Powered by a11y-tracker</div>
        </header>

        <table className="summary-table">
          <thead>
            <tr>
              <th>Overall Score</th>
              <th>Pages Scanned</th>
              <th>Critical Issues</th>
              <th>Serious Issues</th>
              <th>Moderate Issues</th>
              <th>Minor Issues</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{scanRun.score}/100</strong></td>
              <td>{scanRun.pagesScanned}</td>
              <td>{counts.critical}</td>
              <td>{counts.serious}</td>
              <td>{counts.moderate}</td>
              <td>{counts.minor}</td>
            </tr>
          </tbody>
        </table>

        <div className="methodology">
          <strong>Methodology:</strong> This report reflects automated WCAG 2.1/2.2 AA testing performed via the axe-core accessibility engine across {scanRun.pagesScanned} page(s) of the target site. The findings represent real, verifiable code-level violations detected in the live DOM, rather than superficial automated overlay remediations.
        </div>

        {scanRun.statementText && (
          <div style={{marginBottom: '40px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px'}}>
            <strong style={{fontSize: '14px', display: 'block', marginBottom: '10px'}}>Published Accessibility Statement</strong>
            <p style={{margin: 0, fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{scanRun.statementText}</p>
          </div>
        )}

        {groupedIssues.length === 0 ? (
          <p>No accessibility issues were detected during this scan.</p>
        ) : (
          groupedIssues.map((group) => (
            <div key={group.severity} className="severity-section">
              <div className="severity-header">
                {group.severity} Severity ({group.issues.length})
              </div>
              <table className="issues-table">
                <thead>
                  <tr>
                    <th style={{width: '12%'}}>WCAG</th>
                    <th style={{width: '25%'}}>Rule & Description</th>
                    <th style={{width: '25%'}}>Page</th>
                    <th style={{width: '13%'}}>Status</th>
                    <th style={{width: '12%'}}>First Detected</th>
                    <th style={{width: '13%'}}>Last Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {group.issues.map((issue) => (
                    <React.Fragment key={issue.id}>
                      <tr className="issue-row">
                        <td>{issue.wcagCriterion}</td>
                        <td>
                          <strong>{issue.ruleId}</strong>
                          <div style={{marginTop: '4px'}}>{issue.description}</div>
                        </td>
                        <td style={{wordBreak: 'break-all'}}>{issue.pageUrl}</td>
                        <td className="status">{issue.status.replace('_', ' ')}</td>
                        <td>{new Date(issue.firstDetected).toLocaleDateString()}</td>
                        <td>{issue.lastVerified ? new Date(issue.lastVerified).toLocaleDateString() : '—'}</td>
                      </tr>
                      {issue.explanation && (
                        <tr className="explanation-row">
                          <td colSpan={6}>
                            <div className="explanation-box">
                              <div className="explanation-label">Why this matters</div>
                              <p style={{margin: '0 0 10px 0'}}>{issue.explanation}</p>
                              
                              {issue.fixSnippet && (
                                <>
                                  <div className="explanation-label">Suggested Fix</div>
                                  <pre style={{margin: '0'}}>{issue.fixSnippet}</pre>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        <footer>
          Report generated by a11y-tracker on {generatedDate}
        </footer>
      </div>
    </>
  );
}
