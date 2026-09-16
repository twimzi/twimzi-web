import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ModerationItem = {
  id: string;
  module_name: string | null;
  entity_id: string | null;
  status: string | null;
  assigned_to: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    module?: string;
  }>;
};

export default async function AdminModeration({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const moduleName = params.module?.trim() ?? "";

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
    "admin_get_moderation_queue",
    {
      p_search: search || null,
      p_status: status || null,
      p_module_name: moduleName || null,
      p_limit: 100,
      p_offset: 0,
    },
  );

  const moderationItems = (data ?? []) as ModerationItem[];

  const pendingCount = moderationItems.filter(
    (item) => item.status === "pending",
  ).length;

  const reviewCount = moderationItems.filter(
    (item) => item.status === "in_review",
  ).length;

  const approvedCount = moderationItems.filter(
    (item) => item.status === "approved",
  ).length;

  const rejectedCount = moderationItems.filter(
    (item) => item.status === "rejected",
  ).length;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Platform
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Moderation
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Review and monitor content moderation activity.
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
            placeholder="Search module, entity ID or remarks..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

          <select
            name="module"
            defaultValue={moduleName}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All modules</option>
            <option value="business">Business</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="post">Post</option>
            <option value="comment">Comment</option>
            <option value="offer">Offer</option>
            <option value="media">Media</option>
            <option value="user">User</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
          label="Approved"
          value={approvedCount.toLocaleString("en-IN")}
        />

        <StatCard
          label="Rejected"
          value={rejectedCount.toLocaleString("en-IN")}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load moderation queue.
          </p>

          <p className="mt-1">
            Verify that the secure admin moderation RPC migration
            has been installed and that the current account is a
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
                Moderation Queue
              </p>

              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {moderationItems.length} moderation item
                {moderationItems.length === 1 ? "" : "s"} in the
                current result.
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
                    Module
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Entity
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Assigned To
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Remarks
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Created
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Updated
                  </th>
                </tr>
              </thead>

              <tbody>
                {moderationItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <p className="font-semibold text-slate-700">
                        No moderation items found
                      </p>

                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  moderationItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                          {formatModule(item.module_name)}
                        </span>

                        <p className="mt-2 text-[10px] text-slate-400">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {item.entity_id ? (
                          <span className="font-mono text-xs text-slate-600">
                            {item.entity_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            â€”
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-5 py-4">
                        {item.assigned_to ? (
                          <Link
                            href={`/admin/users?q=${encodeURIComponent(
                              item.assigned_to,
                            )}`}
                            className="font-mono text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {item.assigned_to}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[400px] whitespace-pre-wrap break-words text-sm text-slate-600">
                          {item.remarks || "â€”"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(item.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {moderationItems.length > 0 ? (
            <div className="border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              Showing the newest {moderationItems.length} moderation
              item{moderationItems.length === 1 ? "" : "s"}.
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

  if (normalized === "approved") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Approved
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      {status || "Unknown"}
    </span>
  );
}

function formatModule(value: string | null) {
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

