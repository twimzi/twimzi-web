import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type FeaturedBusiness = {
  id: string;
  business_name: string;
  business_code: string;
  business_status: string;
  verification_status: string;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  boost_until: string | null;
  priority_score: number | null;
  total_followers: number | null;
  total_views: number | null;
  profile_completion: number | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminFeatured({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_super_admin");

  if (adminError || !isAdmin) {
    redirect("/");
  }

  const { data, error } = await supabase.rpc(
    "admin_get_featured_businesses",
    {
      p_search: search || null,
      p_limit: 100,
      p_offset: 0,
    },
  );

  const businesses = (data ?? []) as FeaturedBusiness[];

  const now = new Date();

  const featuredCount = businesses.filter(
    (business) => business.is_featured,
  ).length;

  const boostedCount = businesses.filter(
    (business) =>
      business.boost_until !== null &&
      new Date(business.boost_until).getTime() > now.getTime(),
  ).length;

  const activeCount = businesses.filter(
    (business) => business.is_active,
  ).length;

  const verifiedCount = businesses.filter(
    (business) =>
      business.verification_status === "verified",
  ).length;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Growth
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Featured Control
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage featured and boosted businesses.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full max-w-md gap-2"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search business or code..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

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
          label="Featured"
          value={featuredCount}
        />

        <StatCard
          label="Boosted"
          value={boostedCount}
        />

        <StatCard
          label="Active"
          value={activeCount}
        />

        <StatCard
          label="Verified"
          value={verifiedCount}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load featured businesses.
          </p>

          <p className="mt-1">
            Verify that the secure admin featured RPC migration has
            been installed and that the current account is a
            SUPER_ADMIN.
          </p>

          <p className="mt-2 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  <th className="px-5 py-4 font-bold">
                    Business
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Featured
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Boost
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Priority
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Profile
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Followers
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Views
                  </th>

                  <th className="px-5 py-4 font-bold">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {businesses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-14 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      {search
                        ? "No featured businesses matched your search."
                        : "No featured or boosted businesses found."}
                    </td>
                  </tr>
                ) : (
                  businesses.map((business) => (
                    <tr
                      key={business.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/businesses/${business.id}`}
                          className="font-bold text-[var(--color-primary)] hover:underline"
                        >
                          {business.business_name}
                        </Link>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {business.business_code}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {business.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge
                            status={business.business_status}
                          />

                          <BooleanBadge
                            value={business.is_active}
                            yes="Active"
                            no="Inactive"
                          />

                          <span className="text-xs capitalize text-[var(--color-text-muted)]">
                            {formatLabel(
                              business.verification_status,
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <BooleanBadge
                          value={business.is_featured}
                          yes="Featured"
                          no="No"
                        />

                        {business.featured_until ? (
                          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            Until{" "}
                            {formatDate(
                              business.featured_until,
                            )}
                          </p>
                        ) : business.is_featured ? (
                          <p className="mt-2 text-xs text-slate-400">
                            No expiry
                          </p>
                        ) : null}
                      </td>

                      <td className="px-5 py-4">
                        {isBoosted(
                          business.boost_until,
                          now.getTime(),
                        ) ? (
                          <>
                            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                              Boosted
                            </span>

                            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                              Until{" "}
                              {formatDate(
                                business.boost_until,
                              )}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not boosted
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-900">
                          {business.priority_score ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">
                              {business.profile_completion ?? 0}%
                            </span>

                            <span className="text-slate-400">
                              Complete
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[var(--color-primary)]"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    business.profile_completion ?? 0,
                                    0,
                                  ),
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatNumber(
                          business.total_followers ?? 0,
                        )}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatNumber(
                          business.total_views ?? 0,
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(business.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {businesses.length > 0 ? (
            <div className="border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              Showing up to 100 featured or boosted businesses.
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
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold text-slate-900">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function BooleanBadge({
  value,
  yes,
  no,
}: {
  value: boolean;
  yes: string;
  no: string;
}) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
      }
    >
      {value ? yes : no}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    suspended: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function isBoosted(
  value: string | null,
  nowTimestamp: number,
) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  return (
    !Number.isNaN(timestamp) &&
    timestamp > nowTimestamp
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
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
  }).format(date);
}
