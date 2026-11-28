"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PageRow = { path: string; views: number };
type ErrorRow = {
  event_name: string;
  path: string | null;
  message: string | null;
  error_name: string | null;
  status_code: string | null;
  session_id: string | null;
  created_at: string;
};
type ActivityRow = {
  event_name: string;
  path: string | null;
  label: string | null;
  session_id: string | null;
  device_type: string | null;
  created_at: string;
};
type MonitorData = {
  events_today: number;
  sessions_today: number;
  page_views_today: number;
  errors_24h: number;
  events_7d: number;
  top_pages: PageRow[];
  recent_errors: ErrorRow[];
  recent_activity: ActivityRow[];
};

const nf = new Intl.NumberFormat("en-IN");
const dateTime = (value: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
}).format(new Date(value));

function Metric({ label, value, note, alert = false }: { label: string; value: number; note: string; alert?: boolean }) {
  return <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
    <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
    <p className={"mt-2 text-3xl font-semibold tabular-nums " + (alert ? "text-red-600" : "text-slate-900")}>{nf.format(value)}</p>
    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{note}</p>
  </div>;
}

export default function AdminUserExperiencePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Please sign in again.");
      const { data: allowed, error: permissionError } = await supabase.rpc("is_super_admin");
      if (permissionError) throw permissionError;
      if (allowed !== true) throw new Error("Super Admin permission is required.");
      const { data: result, error: queryError } = await supabase.rpc("admin_ux_monitoring_stats");
      if (queryError) throw queryError;
      setData({
        events_today: Number(result?.events_today ?? 0),
        sessions_today: Number(result?.sessions_today ?? 0),
        page_views_today: Number(result?.page_views_today ?? 0),
        errors_24h: Number(result?.errors_24h ?? 0),
        events_7d: Number(result?.events_7d ?? 0),
        top_pages: Array.isArray(result?.top_pages) ? result.top_pages : [],
        recent_errors: Array.isArray(result?.recent_errors) ? result.recent_errors : [],
        recent_activity: Array.isArray(result?.recent_activity) ? result.recent_activity : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user experience monitoring.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 60_000);
    return () => { window.clearTimeout(first); window.clearInterval(refresh); };
  }, [load]);

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Super Admin · Growth & Quality</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">User Experience Monitor</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-secondary)]">Observe visitor journeys, page engagement, interaction failures and browser errors across Twimzi. Refreshes automatically every minute.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/analytics" className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold">Analytics</Link>
        <Link href="/admin/registrations" className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold">Registration CRM</Link>
        <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Refreshing…" : "Refresh now"}</button>
      </div>
    </div>

    {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

    {loading && !data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[1,2,3,4,5].map(x => <div key={x} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div> : data ? <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Visitor sessions today" value={data.sessions_today} note="Pseudonymous browser sessions" />
        <Metric label="Page views today" value={data.page_views_today} note="Tracked page visits" />
        <Metric label="Events today" value={data.events_today} note="Interactions and journey events" />
        <Metric label="Browser / form errors · 24h" value={data.errors_24h} note="JavaScript, resource and form failures" alert={data.errors_24h > 0} />
        <Metric label="Events · 7 days" value={data.events_7d} note="Recent platform activity" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--color-border)] p-5"><h2 className="font-semibold">Most visited pages</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Page views in the last seven days</p></div>
          <div className="p-5">
            {data.top_pages.length ? <div className="space-y-4">{data.top_pages.map((row) => {
              const max = Math.max(...data.top_pages.map(item => item.views), 1);
              return <div key={row.path}>
                <div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate font-medium">{row.path}</span><span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">{nf.format(row.views)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: Math.max(2, row.views / max * 100) + "%" }} /></div>
              </div>;
            })}</div> : <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">No page views recorded yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5"><div><h2 className="font-semibold">Recent errors</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Latest browser, resource and form failures</p></div><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{data.recent_errors.length} logged</span></div>
          <div className="max-h-[440px] divide-y divide-[var(--color-border)] overflow-y-auto">
            {data.recent_errors.length ? data.recent_errors.map((row, index) => <div key={row.created_at + index} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{row.event_name.replaceAll("_", " ")}</span><time className="text-xs text-[var(--color-text-muted)]">{dateTime(row.created_at)}</time></div>
              <p className="mt-2 text-sm font-semibold">{row.error_name || "Interaction failure"}{row.status_code ? " · HTTP " + row.status_code : ""}</p>
              <p className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">{row.message || "No error message supplied"}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Page: {row.path || "—"} · Session: {row.session_id ? row.session_id.slice(0, 12) + "…" : "—"}</p>
            </div>) : <p className="p-10 text-center text-sm text-[var(--color-text-muted)]">No errors recorded. This is a good sign, but not proof that every journey is working.</p>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="border-b border-[var(--color-border)] p-5"><h2 className="font-semibold">Live activity feed</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Most recent tracked events across public and customer-facing pages</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Event</th><th className="px-4 py-3">Page</th><th className="px-4 py-3">Element / step</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Time</th></tr></thead>
            <tbody>{data.recent_activity.map((row,index) => <tr key={row.created_at + index} className="border-t border-[var(--color-border)]">
              <td className="px-5 py-3 font-semibold">{row.event_name.replaceAll("_"," ")}</td><td className="px-4 py-3">{row.path || "—"}</td><td className="px-4 py-3">{row.label || "—"}</td><td className="px-4 py-3">{row.device_type || "—"}</td><td className="px-4 py-3 font-mono text-xs">{row.session_id ? row.session_id.slice(0,12) + "…" : "—"}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-text-muted)]">{dateTime(row.created_at)}</td>
            </tr>)}</tbody>
          </table>
          {!data.recent_activity.length ? <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">No activity has been recorded yet.</p> : null}
        </div>
      </section>
      <p className="text-xs leading-5 text-[var(--color-text-muted)]">Privacy: Twimzi records page paths, interaction labels, technical errors, device category and pseudonymous session IDs. It does not record typed field values, passwords, payment data or full query strings. Anonymous visitor sessions are not treated as verified identities.</p>
    </> : <div className="rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center text-sm text-[var(--color-text-muted)]">Monitoring data could not be loaded. Retry after checking the database migration and permissions.</div>}
  </div>;
}
