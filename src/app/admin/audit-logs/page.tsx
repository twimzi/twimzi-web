"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuditLog = {
  id: string;
  profile_id: string | null;
  module_name: string | null;
  action_name: string | null;
  entity_name: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
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

function formatLabel(value: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatJson(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return "No data";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Unable to display data";
  }
}

export default function AdminAuditLogsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [actionName, setActionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
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
        throw new Error("You do not have permission to access this page.");
      }

      const { data, error: auditError } = await supabase.rpc(
        "admin_get_audit_logs",
        {
          p_search: submittedSearch.trim() || null,
          p_module_name: moduleName || null,
          p_action_name: actionName || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (auditError) {
        throw auditError;
      }

      setLogs((data ?? []) as AuditLog[]);
      setExpandedId(null);
    } catch (err) {
      setLogs([]);
      setError(
        err instanceof Error ? err.message : "Unable to load audit logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [actionName, moduleName, submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAuditLogs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAuditLogs]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setModuleName("");
    setActionName("");
  }

  const statistics = useMemo(() => {
    const modules = new Set(
      logs
        .map((log) => log.module_name)
        .filter((value): value is string => Boolean(value)),
    );

    const actions = new Set(
      logs
        .map((log) => log.action_name)
        .filter((value): value is string => Boolean(value)),
    );

    return {
      total: logs.length,
      modules: modules.size,
      actions: actions.size,
      withChanges: logs.filter(
        (log) => Boolean(log.old_data) || Boolean(log.new_data),
      ).length,
    };
  }, [logs]);

  const moduleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((log) => log.module_name)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [logs],
  );

  const actionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((log) => log.action_name)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [logs],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Review administrative and system activity history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAuditLogs()}
          disabled={loading}
          className="self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Loaded Logs", statistics.total],
          ["Modules", statistics.modules],
          ["Actions", statistics.actions],
          ["With Changes", statistics.withChanges],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
          >
            <p className="text-sm text-[var(--color-text-secondary)]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 xl:flex-row">
          <div className="flex-1">
            <label htmlFor="audit-search" className="sr-only">
              Search audit logs
            </label>
            <input
              id="audit-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search module, action or entity..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
            />
          </div>

          <select
            value={moduleName}
            onChange={(event) => setModuleName(event.target.value)}
            aria-label="Filter by module"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
          >
            <option value="">All modules</option>
            {moduleOptions.map((module) => (
              <option key={module} value={module}>
                {formatLabel(module)}
              </option>
            ))}
          </select>

          <select
            value={actionName}
            onChange={(event) => setActionName(event.target.value)}
            aria-label="Filter by action"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
          >
            <option value="">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {formatLabel(action)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Search
          </button>

          {(submittedSearch || moduleName || actionName) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)]"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadAuditLogs()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-semibold text-[var(--color-text)]">
            Activity History
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Latest audit entries are shown first.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-[var(--color-surface-muted)]"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-lg text-[var(--color-primary-dark)]">
              A
            </div>
            <h3 className="mt-4 font-semibold text-[var(--color-text)]">
              No audit logs found
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">
              {submittedSearch || moduleName || actionName
                ? "No audit entries match the selected filters."
                : "There are currently no audit entries available."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    <th className="px-5 py-3">Module</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">Profile</th>
                    <th className="px-5 py-3">Changes</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {logs.map((log) => {
                    const expanded = expandedId === log.id;

                    return (
                      <tr key={log.id} className="align-top">
                        <td colSpan={6} className="p-0">
                          <div
                            className={`grid grid-cols-[1fr_1fr_1.2fr_1fr_1fr_1fr] transition ${
                              expanded
                                ? "bg-[var(--color-surface-soft)]"
                                : "hover:bg-[var(--color-surface-soft)]"
                            }`}
                          >
                            <div className="px-5 py-4">
                              <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary-dark)]">
                                {formatLabel(log.module_name)}
                              </span>
                            </div>

                            <div className="px-5 py-4">
                              <p className="text-sm font-medium text-[var(--color-text)]">
                                {formatLabel(log.action_name)}
                              </p>
                            </div>

                            <div className="px-5 py-4">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {log.entity_name || "Unknown entity"}
                              </p>
                              <p className="mt-1 font-mono text-xs text-[var(--color-text-light)]">
                                {truncateId(log.entity_id)}
                              </p>
                            </div>

                            <div className="px-5 py-4">
                              <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                                {truncateId(log.profile_id)}
                              </span>
                            </div>

                            <div className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId(expanded ? null : log.id)
                                }
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                              >
                                {expanded ? "Hide Changes" : "View Changes"}
                              </button>
                            </div>

                            <div className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                              {formatDateTime(log.created_at)}
                            </div>
                          </div>

                          {expanded && (
                            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] px-5 py-5">
                              <div className="grid gap-5 xl:grid-cols-2">
                                {[
                                  ["Previous Data", log.old_data],
                                  ["New Data", log.new_data],
                                ].map(([label, data]) => (
                                  <div key={String(label)}>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                                      {String(label)}
                                    </p>
                                    <pre className="max-h-80 overflow-auto rounded-xl bg-[var(--color-primary-darker)] p-4 text-xs leading-5 text-white">
                                      {formatJson(
                                        data as Record<string, unknown> | null,
                                      )}
                                    </pre>
                                  </div>
                                ))}
                              </div>

                              <p className="mt-4 font-mono text-xs text-[var(--color-text-light)]">
                                Log ID: {log.id}
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[var(--color-border-light)] lg:hidden">
              {logs.map((log) => {
                const expanded = expandedId === log.id;

                return (
                  <div key={log.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary-dark)]">
                          {formatLabel(log.module_name)}
                        </span>
                        <h3 className="mt-3 font-semibold text-[var(--color-text)]">
                          {formatLabel(log.action_name)}
                        </h3>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--color-text-light)]">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-surface-soft)] p-4 text-xs">
                      <div>
                        <p className="text-[var(--color-text-light)]">Entity</p>
                        <p className="mt-1 font-medium text-[var(--color-text-secondary)]">
                          {log.entity_name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-light)]">
                          Entity ID
                        </p>
                        <p className="mt-1 font-mono text-[var(--color-text-secondary)]">
                          {truncateId(log.entity_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-light)]">
                          Profile
                        </p>
                        <p className="mt-1 font-mono text-[var(--color-text-secondary)]">
                          {truncateId(log.profile_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-light)]">
                          Log ID
                        </p>
                        <p className="mt-1 font-mono text-[var(--color-text-secondary)]">
                          {truncateId(log.id)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : log.id)
                      }
                      className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                    >
                      {expanded ? "Hide Changes" : "View Changes"}
                    </button>

                    {expanded && (
                      <div className="mt-4 space-y-4">
                        {[
                          ["Previous Data", log.old_data],
                          ["New Data", log.new_data],
                        ].map(([label, data]) => (
                          <div key={String(label)}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                              {String(label)}
                            </p>
                            <pre className="max-h-72 overflow-auto rounded-xl bg-[var(--color-primary-darker)] p-4 text-xs leading-5 text-white">
                              {formatJson(
                                data as Record<string, unknown> | null,
                              )}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[var(--color-border)] px-5 py-4 text-xs text-[var(--color-text-secondary)]">
              Showing {logs.length} audit log{logs.length === 1 ? "" : "s"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
