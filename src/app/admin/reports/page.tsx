import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReportItem = {
  id: string;
  reported_by: string | null;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  status: string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    entity?: string;
  }>;
};

export default async function AdminReports({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const entityType = params.entity?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc("is_super_admin");

  if (adminError || !isAdmin) {
    redirect("/");
  }

  const { data, error } = await supabase.rpc(
    "admin_get_reports",
    {
      p_search: search || null,
      p_status: status || null,
      p_entity_type: entityType || null,
      p_limit: 100,
      p_offset: 0,
    },
  );

  const reports = (data ?? []) as ReportItem[];

  const pendingCount = reports.filter(
    (item) => item.status === "pending",
  ).length;

  const reviewCount = reports.filter(
    (item) => item.status === "in_review",
  ).length;

  const resolvedCount = reports.filter(
    (item) => item.status === "resolved",
  ).length;

  const dismissedCount = reports.filter(
    (item) => item.status === "dismissed",
  ).length;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Platform
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Reports
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Review reports submitted against Twimzi entities.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full max-w-3xl flex-col gap-2 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search entity, reason or report ID..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

          <select
            name="entity"
            defaultValue={entityType}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All entities</option>
            <option value="business">Business</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="post">Post</option>
            <option value="comment">Comment</option>
            <option value="offer">Offer</option>
            <option value="user">User</option>
            <option value="media">Media</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending"
          value={pendingCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="In Review"
          value={reviewCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="Resolved"
          value={resolvedCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="Dismissed"
          value={dismissedCount.toLocaleString("en-IN")}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load reports.
          </p>

          <p className="mt-1">
            Verify that the secure admin reports RPC migration has
            been installed and that the current account is a
            SUPER_ADMIN.
          </p>

          <p className="mt-2 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="flex items-center justify-between border-b bg-[var(--color-surface)] px-5 py-4">
            <div>
              <p className="font-bold text-slate-900">
                Report Queue
              </p>

              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {reports.length} report
                {reports.length === 1 ? "" : "s"} in the current
                result.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Up to 100 results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-4 font-bold">
                    Report
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Reporter
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Entity
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Entity ID
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Reason
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <p className="font-semibold text-slate-700">
                        No reports found
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          Report
                        </p>

                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                          {report.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {report.reported_by ? (
                          <Link
                            href={`/admin/users?q=${encodeURIComponent(
                              report.reported_by,
                            )}`}
                            className="font-mono text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {report.reported_by}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unknown
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                          {formatEntityType(
                            report.entity_type,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {report.entity_id ? (
                          <span className="font-mono text-xs text-slate-600">
                            {report.entity_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            â€”
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[420px] whitespace-pre-wrap break-words text-sm text-slate-600">
                          {report.reason || "No reason provided"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(report.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {reports.length > 0 ? (
            <div className="border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              Showing the newest {reports.length} report
              {reports.length === 1 ? "" : "s"}.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalized = status?.toLowerCase() ?? "";

  if (normalized === "pending") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Pending
      </span>
    );
  }

  if (normalized === "in_review") {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        In Review
      </span>
    );
  }

  if (normalized === "resolved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Resolved
      </span>
    );
  }

  if (normalized === "dismissed") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        Dismissed
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      {status || "Unknown"}
    </span>
  );
}

function formatEntityType(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value.replace(/[_-]+/g, " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "â€”";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
