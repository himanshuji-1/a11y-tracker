"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestScanPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectOnSuccess, setRedirectOnSuccess] = useState(true);

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed");
      } else {
        setResult(JSON.stringify(data, null, 2));

        // Redirect to the dashboard unless user opted for raw JSON
        if (redirectOnSuccess) {
          router.push(`/scan/${data.id}`);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>A11y Tracker — Test Scan (Debug)</h1>
      <p>Enter a URL to scan for accessibility issues:</p>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          style={{
            width: "400px",
            padding: "8px",
            marginRight: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            color: "#000",
            backgroundColor: "#fff",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleScan();
          }}
        />
        <button
          onClick={handleScan}
          disabled={loading || !url.trim()}
          style={{
            padding: "8px 16px",
            cursor: loading ? "wait" : "pointer",
            backgroundColor: loading ? "#999" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "14px", color: "#666" }}>
          <input
            type="checkbox"
            checked={redirectOnSuccess}
            onChange={(e) => setRedirectOnSuccess(e.target.checked)}
            style={{ marginRight: "6px" }}
          />
          Redirect to dashboard after scan (uncheck to see raw JSON)
        </label>
      </div>

      {loading && (
        <p style={{ color: "#666" }}>
          ⏳ Scanning... This may take 30-60 seconds while Puppeteer loads pages
          and runs axe-core.
        </p>
      )}

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee",
            border: "1px solid #f00",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2>Scan Results (Raw JSON)</h2>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "80vh",
              fontSize: "12px",
              color: "#000",
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
