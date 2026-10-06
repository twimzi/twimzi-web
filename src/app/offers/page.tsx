import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Gift,
  Search,
  Store,
  Tag,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Offers | Twimzi",
  description:
    "Discover active offers and promotions from local businesses on Twimzi.",
};

type Offer = {
  id: string;
  business_id: string;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  coupon_code: string | null;
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
  terms_conditions: string | null;
  created_at: string;
};

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
};

type SearchParams = {
  q?: string;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatMoney(value: number | null) {
  if (value === null) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDiscount(offer: Offer) {
  const value = asNumber(offer.discount_value);

  if (value === null) {
    return null;
  }

  const type = asString(offer.discount_type)?.toLowerCase() ?? "";

  if (
    type.includes("percent") ||
    type.includes("percentage") ||
    type.includes("%")
  ) {
    return `${value}% OFF`;
  }

  if (
    type.includes("fixed") ||
    type.includes("amount") ||
    type.includes("flat")
  ) {
    return `${formatMoney(value)} OFF`;
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getBusinessHref(business: Business | undefined) {
  if (!business) {
    return "/businesses";
  }

  return `/businesses/${business.slug || business.id}`;
}

function normalizeOffer(value: Record<string, unknown>): Offer {
  return {
    id: asString(value.id) ?? "",
    business_id: asString(value.business_id) ?? "",
    title: asString(value.title),
    slug: asString(value.slug),
    short_description: asString(value.short_description),
    description: asString(value.description),
    coupon_code: asString(value.coupon_code),
    offer_type: asString(value.offer_type),
    discount_type: asString(value.discount_type),
    discount_value: asNumber(value.discount_value),
    minimum_order_amount: asNumber(
      value.minimum_order_amount ?? value.min_purchase_amount,
    ),
    maximum_discount_amount: asNumber(
      value.maximum_discount_amount ?? value.max_discount_amount,
    ),
    redemption_limit: asNumber(value.redemption_limit),
    redemption_count: asNumber(value.redemption_count),
    per_user_limit: asNumber(value.per_user_limit),
    start_at: asString(value.start_at),
    end_at: asString(value.end_at),
    visibility: asString(value.visibility),
    status: asString(value.status),
    priority: asNumber(value.priority),
    is_featured:
      typeof value.is_featured === "boolean"
        ? value.is_featured
        : null,
    terms_conditions: asString(value.terms_conditions),
    created_at: asString(value.created_at) ?? "",
  };
}

function OfferCard({
  offer,
  business,
}: {
  offer: Offer;
  business: Business | undefined;
}) {
  const discount = formatDiscount(offer);
  const offerHref = offer.slug ? `/offers/${offer.slug}` : "/offers";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary-light)]">
      <Link
        href={offerHref}
        aria-label={`View ${offer.title || "Special Offer"}`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      />

      <div className="relative z-10 flex min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)] via-[var(--color-secondary)] to-[var(--color-accent-light)] p-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm">
            <Gift className="h-7 w-7" />
          </div>

          {discount ? (
            <p className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--color-primary-dark)]">
              {discount}
            </p>
          ) : (
            <p className="mt-4 text-lg font-extrabold text-[var(--color-text)]">
              Special Offer
            </p>
          )}
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {offer.is_featured ? (
            <span className="rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-xs font-bold text-[var(--color-primary-dark)] backdrop-blur">
              Featured
            </span>
          ) : null}

          {offer.offer_type ? (
            <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-bold capitalize text-white">
              {offer.offer_type}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-5">
        <h2 className="line-clamp-2 text-base font-bold leading-6 text-[var(--color-text)]">
          {offer.title || "Special Offer"}
        </h2>

        {offer.short_description || offer.description ? (
          <p className="mt-3 line-clamp-3 min-h-15 text-sm leading-5 text-[var(--color-text-secondary)]">
            {offer.short_description || offer.description}
          </p>
        ) : null}

        {offer.coupon_code ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-soft)] px-3 py-2.5">
            <Tag className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />

            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              Code
            </span>

            <code className="ml-auto text-sm font-extrabold tracking-wide text-[var(--color-text)]">
              {offer.coupon_code}
            </code>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--color-surface-soft)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Starts</p>

            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {formatDate(offer.start_at)}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-soft)] p-3">
            <p className="text-xs text-[var(--color-text-muted)]">Ends</p>

            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {formatDate(offer.end_at)}
            </p>
          </div>
        </div>

        {offer.minimum_order_amount !== null ? (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Minimum order: {formatMoney(offer.minimum_order_amount)}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Clock3 className="h-3.5 w-3.5" />
          Valid until {formatDateTime(offer.end_at)}
        </div>

        <div className="mt-4 border-t border-[var(--color-border-light)] pt-4">
          <Link
            href={getBusinessHref(business)}
            className="relative z-20 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text)] transition group-hover:text-[var(--color-primary-dark)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Store className="h-4 w-4 shrink-0 text-[var(--color-text-light)]" />

              <span className="truncate">
                {business?.business_name || "View Business"}
              </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  /*
   * Public offer discovery uses the existing offers table and its
   * existing RLS policy:
   *
   *   deleted_at IS NULL
   *   is_active = true
   *   status = 'active'
   *
   * get_active_offers() requires a specific business_id, so it is
   * intentionally not used for global offer discovery.
   */
  const [
    { data: offersData, error: offersError },
    { data: businessesData, error: businessesError },
  ] = await Promise.all([
    supabase
      .from("offers")
      .select("*")
      .eq("is_active", true)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("priority", { ascending: false })
      .order("start_at", { ascending: false }),

    supabase.rpc("get_public_businesses", {
      p_search: null,
      p_limit: 100,
      p_offset: 0,
    }),
  ]);

  const rawOffers = (offersData ?? []) as Record<string, unknown>[];

  let offers = rawOffers
    .map(normalizeOffer)
    .filter((offer) => offer.id && offer.business_id);

  if (search) {
    const query = search.toLowerCase();

    offers = offers.filter((offer) =>
      [
        offer.title,
        offer.short_description,
        offer.description,
        offer.coupon_code,
        offer.offer_type,
        offer.discount_type,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }

  offers.sort((a, b) => {
    if (Boolean(a.is_featured) !== Boolean(b.is_featured)) {
      return a.is_featured ? -1 : 1;
    }

    if ((b.priority ?? 0) !== (a.priority ?? 0)) {
      return (b.priority ?? 0) - (a.priority ?? 0);
    }

    return (
      new Date(b.start_at ?? b.created_at).getTime() -
      new Date(a.start_at ?? a.created_at).getTime()
    );
  });

  const businesses = (businessesData ?? []) as Business[];

  const businessesById = new Map(
    businesses.map((business) => [business.id, business]),
  );

  const loadError = offersError || businessesError;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--color-background)]">
      <section className="relative overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-secondary)]">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[var(--color-primary-light)] opacity-80 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-[var(--color-accent-light)] opacity-70 blur-3xl" />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-light)] bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)] shadow-[var(--shadow-xs)] backdrop-blur">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <Gift className="h-4 w-4 text-[var(--color-primary)]" />
              Offer Discovery
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Discover Offers on Twimzi
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
              Find active promotions, discounts, coupon codes, and special
              offers from local businesses.
            </p>
          </div>

          <form
            method="get"
            className="mt-8 flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-light)]" />

              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search offers, discounts, coupon codes..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                aria-label="Search offers"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
            >
              <Search className="h-4 w-4" />
              Search
            </button>

            {search ? (
              <Link
                href="/offers"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-soft)]"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p className="font-bold">Unable to load offers.</p>

            <p className="mt-1">
              The offer service is temporarily unavailable. Please try again
              later.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  {offers.length}{" "}
                  {offers.length === 1 ? "offer" : "offers"} found
                </p>

                <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
                  {search ? `Results for “${search}”` : "Active Offers"}
                </h2>
              </div>

              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)] hover:underline"
              >
                <Store className="h-4 w-4" />
                Browse Businesses
              </Link>
            </div>

            {offers.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-text-muted)]">
                  <Gift className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[var(--color-text)]">
                  No active offers found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                  {search
                    ? "Try a different offer name, discount, or coupon code."
                    : "There are no active public offers available yet."}
                </p>

                {search ? (
                  <Link
                    href="/offers"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                  >
                    View all offers
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    business={businessesById.get(offer.business_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}