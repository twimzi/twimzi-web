"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  reported_by: string | null;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "in_review":
      return "bg-blue-50 text-blue-700";

    case "resolved":
      return "bg-emerald-50 text-emerald-700";

    case "dismissed":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatStatus(status: string | null) {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function AdminReportsPage() {
  const supabase = createSupabaseBrowserClient();

  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_super_admin");

      if (adminError) {
        throw adminError;
      }

      if (!adminCheck) {
        setIsSuperAdmin(false);
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      setIsSuperAdmin(true);

      const { data, error: reportsError } = await supabase.rpc(
        "admin_get_reports",
        {
          p_search: submittedSearch.trim() || null,
          p_status: status || null,
          p_entity_type: entityType || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (reportsError) {
        throw reportsError;
      }

      setReports((data ?? []) as Report[]);
    } catch (err) {
      setReports([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [entityType, status, submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadReports]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setStatus("");
    setEntityType("");
  }

  const statistics = useMemo(() => {
    const pending = reports.filter(
      (report) => report.status === "pending",
    ).length;

    const inReview = reports.filter(
      (report) => report.status === "in_review",
    ).length;

    const resolved = reports.filter(
      (report) => report.status === "resolved",
    ).length;

    const dismissed = reports.filter(
      (report) => report.status === "dismissed",
    ).length;

    return {
      pending,
      inReview,
      resolved,
      dismissed,
    };
  }, [reports]);

  if (!isSuperAdmin && !loading && error.includes("permission")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Reports
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Reports
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review reports submitted against Twimzi entities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Reports Loaded
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {reports.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statistics.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">In Review</p>

          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.inReview}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Resolved</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.resolved}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Dismissed</p>

          <p className="mt-2 text-2xl font-semibold text-slate-700">
            {statistics.dismissed}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 xl:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="report-search" className="sr-only">
              Search reports
            </label>

            <input
              id="report-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by entity type, reason, entity ID or reporter ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter reports by status"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            aria-label="Filter reports by entity type"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All entity types</option>
            <option value="business">Business</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="post">Post</option>
            <option value="offer">Offer</option>
            <option value="profile">Profile</option>
            <option value="message">Message</option>
            <option value="comment">Comment</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {(submittedSearch || status || entityType) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && !error.includes("permission") && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadReports()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Report Queue
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Pending and in-review reports are returned first.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReports()}
            disabled={loading}
            className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              R
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No reports found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch || status || entityType
                ? "No reports match the selected filters."
                : "There are currently no reports available to display."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Report</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Reported By</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {report.reason || "No reason provided"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Report ID: {truncateId(report.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {report.entity_type || "Unknown"}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {truncateId(report.entity_id)}
                        </p>
                      </td>

                      <td className="max-w-sm px-5 py-4">
                        <p className="truncate text-sm text-slate-600">
                          {report.reason || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            report.status,
                          )}`}
                        >
                          {formatStatus(report.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          {truncateId(report.reported_by)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(report.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {reports.map((report) => (
                <div key={report.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {report.reason ||
                          "No reason provided"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Report ID: {truncateId(report.id)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        report.status,
                      )}`}
                    >
                      {formatStatus(report.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Entity
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {report.entity_type || "Unknown"}
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-slate-400">
                      {report.entity_id || "—"}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-500">
                      Reason
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {report.reason || "No reason provided"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
                    <p>
                      Reported by:{" "}
                      <span className="font-mono">
                        {report.reported_by || "—"}
                      </span>
                    </p>

                    <p>
                      Created:{" "}
                      {formatDateTime(report.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}