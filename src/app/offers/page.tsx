"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Offer = {
  id: string;
  business_id: string;
  business_name: string | null;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  offer_type: string | null;
  discount_type: string | null;
  discount_value: number | null;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  redemption_limit: number | null;
  redemption_count: number | null;
  per_user_limit: number | null;
  start_at: string | null;
  end_at: string | null;
  visibility: string | null;
  status: string | null;
  priority: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

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

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDiscount(offer: Offer) {
  if (
    offer.discount_value === null ||
    offer.discount_value === undefined
  ) {
    return "—";
  }

  if (offer.discount_type?.toLowerCase().includes("percent")) {
    return `${offer.discount_value}%`;
  }

  return formatMoney(offer.discount_value);
}

function statusClasses(status: string | null) {
  switch (status?.toLowerCase()) {
    case "active":
    case "published":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
    case "draft":
      return "bg-amber-50 text-amber-700";

    case "expired":
    case "rejected":
    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AdminOffersPage() {
  const supabase = createSupabaseBrowserClient();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadOffers = useCallback(async () => {
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

      const { data, error: offersError } = await supabase.rpc(
        "admin_get_offers",
        {
          p_search: submittedSearch.trim() || null,
          p_status: status || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (offersError) {
        throw offersError;
      }

      setOffers((data ?? []) as Offer[]);
    } catch (err) {
      setOffers([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load offers.",
      );
    } finally {
      setLoading(false);
    }
  }, [status, submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOffers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOffers]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setStatus("");
  }

  if (!isSuperAdmin && !loading && error.includes("permission")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Offers
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const featuredCount = offers.filter(
    (offer) => offer.is_featured,
  ).length;

  const activeCount = offers.filter((offer) => {
    const value = offer.status?.toLowerCase();

    return value === "active" || value === "published";
  }).length;

  const redemptionCount = offers.reduce(
    (total, offer) => total + (offer.redemption_count ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Offers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage promotional offers published by Twimzi businesses.
          </p>
        </div>

        <Link
          href="/offers"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View Public Offers
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Offers Loaded</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {offers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Featured</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {featuredCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Redemptions</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {redemptionCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 xl:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="offer-search" className="sr-only">
              Search offers
            </label>

            <input
              id="offer-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by offer, slug, description or business..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {(submittedSearch || status) && (
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
            onClick={() => void loadOffers()}
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
              Offer Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing up to 100 offers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOffers()}
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
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              O
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No offers found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch || status
                ? "No offers match the selected filters."
                : "There are currently no offers available to display."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Offer</th>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Validity</th>
                    <th className="px-5 py-3">Redemptions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {offers.map((offer) => (
                    <tr
                      key={offer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {offer.title || "Untitled offer"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {offer.slug || offer.id}
                          </p>

                          {offer.short_description && (
                            <p className="mt-1 max-w-sm truncate text-xs text-slate-400">
                              {offer.short_description}
                            </p>
                          )}

                          {offer.is_featured && (
                            <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/businesses/${offer.business_id}`}
                          className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          {offer.business_name || "Unknown business"}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {formatDiscount(offer)}
                        </p>

                        {offer.minimum_order_amount !== null && (
                          <p className="mt-1 text-xs text-slate-500">
                            Min.{" "}
                            {formatMoney(offer.minimum_order_amount)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            offer.status,
                          )}`}
                        >
                          {offer.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>{formatDate(offer.start_at)}</p>

                        <p className="mt-1 text-xs text-slate-400">
                          to {formatDate(offer.end_at)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        <p>
                          {offer.redemption_count ?? 0}
                          {offer.redemption_limit !== null &&
                            ` / ${offer.redemption_limit}`}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {offers.map((offer) => (
                <div key={offer.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {offer.title || "Untitled offer"}
                      </p>

                      <Link
                        href={`/admin/businesses/${offer.business_id}`}
                        className="mt-1 block truncate text-sm text-slate-500 hover:text-slate-900 hover:underline"
                      >
                        {offer.business_name || "Unknown business"}
                      </Link>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        offer.status,
                      )}`}
                    >
                      {offer.status || "Unknown"}
                    </span>
                  </div>

                  {offer.short_description && (
                    <p className="mt-3 text-sm text-slate-500">
                      {offer.short_description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Discount
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDiscount(offer)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Redemptions
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {offer.redemption_count ?? 0}
                        {offer.redemption_limit !== null &&
                          ` / ${offer.redemption_limit}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {offer.is_featured && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        Featured
                      </span>
                    )}

                    {offer.offer_type && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {offer.offer_type}
                      </span>
                    )}

                    {offer.visibility && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {offer.visibility}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    <p>
                      Starts: {formatDateTime(offer.start_at)}
                    </p>

                    <p className="mt-1">
                      Ends: {formatDateTime(offer.end_at)}
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