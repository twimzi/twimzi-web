"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FeaturedBusiness = {
  id: string;
  business_name: string | null;
  business_code: string | null;
  business_status: string | null;
  verification_status: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  boost_until: string | null;
  priority_score: number | null;
  total_followers: number | null;
  total_views: number | null;
  profile_completion: number | null;
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

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function isFuture(value: string | null) {
  if (!value) return false;

  return new Date(value).getTime() > Date.now();
}

export default function AdminFeaturedPage() {
  const supabase = createSupabaseBrowserClient();

  const [businesses, setBusinesses] = useState<FeaturedBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeaturedBusinesses = useCallback(async () => {
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
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      const { data, error: featuredError } = await supabase.rpc(
        "admin_get_featured_businesses",
        {
          p_search: submittedSearch.trim() || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (featuredError) {
        throw featuredError;
      }

      setBusinesses((data ?? []) as FeaturedBusiness[]);
    } catch (err) {
      setBusinesses([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load featured businesses.",
      );
    } finally {
      setLoading(false);
    }
  }, [submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeaturedBusinesses();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadFeaturedBusinesses]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
  }

  const statistics = useMemo(() => {
    return {
      total: businesses.length,
      featured: businesses.filter((business) => business.is_featured)
        .length,
      boosted: businesses.filter((business) =>
        isFuture(business.boost_until),
      ).length,
      active: businesses.filter((business) => business.is_active).length,
      verified: businesses.filter(
        (business) =>
          business.verification_status?.toLowerCase() === "verified",
      ).length,
      totalFollowers: businesses.reduce(
        (sum, business) => sum + (business.total_followers ?? 0),
        0,
      ),
      totalViews: businesses.reduce(
        (sum, business) => sum + (business.total_views ?? 0),
        0,
      ),
    };
  }, [businesses]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Featured Businesses
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review businesses currently featured or receiving an active boost.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Featured</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statistics.featured}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Boost</p>
          <p className="mt-2 text-2xl font-semibold text-purple-700">
            {statistics.boosted}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.active}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Verified</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.verified}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Views</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.totalViews.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="featured-search" className="sr-only">
              Search featured businesses
            </label>

            <input
              id="featured-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business name or business code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {submittedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
            onClick={() => void loadFeaturedBusinesses()}
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
              Featured Business Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Featured and actively boosted businesses are included.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFeaturedBusinesses()}
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
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              F
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No featured businesses found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch
                ? "No featured businesses match your search."
                : "There are currently no featured or actively boosted businesses."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Promotion</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Audience</th>
                    <th className="px-5 py-3">Profile</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {businesses.map((business) => (
                    <tr
                      key={business.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate font-medium text-slate-900">
                          {business.business_name || "Unnamed business"}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {business.business_code || truncateId(business.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              business.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {business.is_active ? "Active" : "Inactive"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {business.business_status || "Unknown"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          {business.is_featured && (
                            <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Featured
                            </span>
                          )}

                          {isFuture(business.boost_until) && (
                            <span className="w-fit rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                              Boosted
                            </span>
                          )}

                          <span className="text-xs text-slate-400">
                            {business.featured_until
                              ? `Featured until ${formatDateTime(
                                  business.featured_until,
                                )}`
                              : "No feature expiry"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700">
                          {business.priority_score ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>
                            Followers:{" "}
                            <span className="font-medium text-slate-700">
                              {(business.total_followers ?? 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </p>

                          <p>
                            Views:{" "}
                            <span className="font-medium text-slate-700">
                              {(business.total_views ?? 0).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-700"
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

                          <span className="text-xs text-slate-500">
                            {business.profile_completion ?? 0}%
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(business.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {businesses.map((business) => (
                <div key={business.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {business.business_name || "Unnamed business"}
                      </h3>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {business.business_code || truncateId(business.id)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {business.is_featured && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Featured
                        </span>
                      )}

                      {isFuture(business.boost_until) && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                          Boosted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Status</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {business.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Verification</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {business.verification_status || "Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Priority</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {business.priority_score ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Profile</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {business.profile_completion ?? 0}%
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Followers</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {(business.total_followers ?? 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400">Views</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {(business.total_views ?? 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <p>
                      Featured until:{" "}
                      {formatDateTime(business.featured_until)}
                    </p>

                    <p>
                      Boost until:{" "}
                      {formatDateTime(business.boost_until)}
                    </p>

                    <p>
                      Created: {formatDateTime(business.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {businesses.length} featured business
              {businesses.length === 1 ? "" : "es"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}