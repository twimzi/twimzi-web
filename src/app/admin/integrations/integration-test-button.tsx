"use client";

import { useState } from "react";

type Provider = "ga4" | "gsc" | "bing";

export default function IntegrationTestButton({
  provider,
  configured,
}: {
  provider: Provider;
  configured: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; testedAt?: string } | null>(null);

  async function testConnection() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
        cache: "no-store",
      });
      const data = await response.json();
      setResult({
        ok: response.ok && data.ok === true,
        message: data.message || data.error || "Connection test failed.",
        testedAt: data.testedAt,
      });
    } catch {
      setResult({ ok: false, message: "Could not reach the integration test endpoint." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={testConnection}
        disabled={loading || !configured}
        className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Testing connection…" : "Test live connection"}
      </button>
      {!configured && <p className="mt-2 text-xs text-amber-700">Add the required server credentials in Hostinger to enable testing.</p>}
      {result && (
        <div className={`mt-3 rounded-xl border p-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">
          <p className="font-semibold">{result.ok ? "Connection successful" : "Connection not verified"}</p>
          <p className="mt-1">{result.message}</p>
          {result.testedAt && <p className="mt-1 text-xs opacity-75">Tested {new Date(result.testedAt).toLocaleString("en-IN")}</p>}
        </div>
      )}
    </div>
  );
}
