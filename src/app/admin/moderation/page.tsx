"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ModerationItem = {
  id: string;
  module_name: string | null;
  entity_id: string | null;
  status: string | null;
  assigned_to: string | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
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

function formatStatus(status: string | null) {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "in_review":
      return "bg-blue-50 text-blue-700";

    case "approved":
      return "bg-emerald-50 text-emerald-700";

    case "rejected":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function AdminModerationPage() {
  const supabase = createSupabaseBrowserClient();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadModeration = useCallback(async () => {
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

      const { data, error: moderationError } = await supabase.rpc(
        "admin_get_moderation_queue",
        {
          p_search: submittedSearch.trim() || null,
          p_status: status || null,
          p_module_name: moduleName || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (moderationError) {
        throw moderationError;
      }

      setItems((data ?? []) as ModerationItem[]);
    } catch (err) {
      setItems([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load moderation queue.",
      );
    } finally {
      setLoading(false);
    }
  }, [moduleName, status, submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadModeration();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadModeration]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setStatus("");
    setModuleName("");
  }

  const statistics = useMemo(() => {
    return {
      pending: items.filter((item) => item.status === "pending").length,
      inReview: items.filter(
        (item) => item.status === "in_review",
      ).length,
      approved: items.filter(
        (item) => item.status === "approved",
      ).length,
      rejected: items.filter(
        (item) => item.status === "rejected",
      ).length,
    };
  }, [items]);

  if (!isSuperAdmin && !loading && error.includes("permission")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Moderation
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
          Moderation
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review and monitor content waiting for moderation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Queue Items
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {items.length}
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
          <p className="text-sm text-slate-500">Approved</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.approved}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected</p>

          <p className="mt-2 text-2xl font-semibold text-red-700">
            {statistics.rejected}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 xl:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="moderation-search" className="sr-only">
              Search moderation queue
            </label>

            <input
              id="moderation-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by module, remarks or entity ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by moderation status"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={moduleName}
            onChange={(event) => setModuleName(event.target.value)}
            aria-label="Filter by module"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All modules</option>
            <option value="business">Business</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="post">Post</option>
            <option value="offer">Offer</option>
            <option value="community">Community</option>
            <option value="profile">Profile</option>
            <option value="media">Media</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {(submittedSearch || status || moduleName) && (
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
            onClick={() => void loadModeration()}
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
              Moderation Queue
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Pending and in-review items are returned first.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadModeration()}
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
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              M
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Moderation queue is empty
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch || status || moduleName
                ? "No moderation items match the selected filters."
                : "There are currently no moderation items to review."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Module</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned To</th>
                    <th className="px-5 py-3">Remarks</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {item.module_name || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-slate-500">
                          {truncateId(item.entity_id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            item.status,
                          )}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          {truncateId(item.assigned_to)}
                        </span>
                      </td>

                      <td className="max-w-sm px-5 py-4">
                        <p className="truncate text-sm text-slate-600">
                          {item.remarks || "No remarks"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.module_name || "Unknown"}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        item.status,
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Entity ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-slate-700">
                      {item.entity_id || "—"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500">
                      Remarks
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {item.remarks || "No remarks"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
                    <p>
                      Assigned to:{" "}
                      <span className="font-mono">
                        {item.assigned_to || "Unassigned"}
                      </span>
                    </p>

                    <p>
                      Created:{" "}
                      {formatDateTime(item.created_at)}
                    </p>

                    <p>
                      Updated:{" "}
                      {formatDateTime(item.updated_at)}
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