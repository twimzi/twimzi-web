import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

type BusinessRow = {
  id: string;
  business_name: string;
  business_code: string | null;
  business_status: string | null;
  verification_status: string | null;
  is_active: boolean;
  is_featured: boolean;
  priority_score: number | null;
  created_at: string | null;
};

const STATUSES = [
  "all",
  "draft",
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

function statusClass(status: string | null) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "suspended":
      return "border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatStatus(value: string | null) {
  if (!value) return "Unknown";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function AdminBusinesses({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const search = params.search?.trim() ?? "";
  const requestedStatus = params.status?.trim() ?? "all";

  const status = STATUSES.includes(
    requestedStatus as (typeof STATUSES)[number],
  )
    ? requestedStatus
    : "all";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_admin_businesses", {
    p_search: search || null,
    p_status: status === "all" ? null : status,
    p_limit: 100,
    p_offset: 0,
  });

  const businesses = (data ?? []) as BusinessRow[];

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Business Management
          </p>

          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Businesses
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage, review, approve, feature, and monitor businesses on Twimzi.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex w-fit items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
        >
          ← Dashboard
        </Link>
      </div>

      <form
        method="get"
        className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-5"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div>
            <label
              htmlFor="search"
              className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
            >
              Search
            </label>

            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Business name, code, slug or handle"
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={status}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All statuses" : formatStatus(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Search
            </button>

            <Link
              href="/admin/businesses"
              className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-bold hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">Businesses could not be loaded.</p>
          <p className="mt-1">
            The admin business query returned an error. Please try again.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {businesses.length} business
                {businesses.length === 1 ? "" : "es"} found
              </p>

              {search || status !== "all" ? (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing filtered results.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Showing the latest 100 businesses.
                </p>
              )}
            </div>

            <Link
              href="/admin/businesses?status=pending"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100"
            >
              Review Pending
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            {businesses.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-[var(--color-surface)]">
                    <tr>
                      {[
                        "Business",
                        "Status",
                        "Verification",
                        "Active",
                        "Featured",
                        "Priority",
                        "Created",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-4 font-bold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {businesses.map((business) => (
                      <tr
                        key={business.id}
                        className="border-b last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/businesses/${business.id}`}
                            className="font-bold text-[var(--color-primary)] hover:underline"
                          >
                            {business.business_name}
                          </Link>

                          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {business.business_code ?? "No business code"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                              business.business_status,
                            )}`}
                          >
                            {formatStatus(business.business_status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold capitalize text-slate-700">
                            {business.verification_status ?? "unverified"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {business.is_active ? (
                            <span className="font-semibold text-emerald-700">
                              Yes
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-500">
                              No
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {business.is_featured ? (
                            <span className="font-semibold text-[var(--color-primary)]">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-500">No</span>
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {business.priority_score ?? 0}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatDate(business.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/businesses/${business.id}`}
                            className="inline-flex rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold hover:bg-slate-100"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <p className="font-bold text-slate-800">
                  No businesses found.
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Try another search term or status filter.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}