import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  Gift,
  Store,
  Tag,
} from "lucide-react";
import { notFound } from "next/navigation";

import { StructuredData } from "@/components/seo/structured-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Offer = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
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
  created_at: string | null;
};

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDiscount(offer: Offer) {
  if (offer.discount_value === null) {
    return null;
  }

  const type = offer.discount_type?.toLowerCase() ?? "";

  if (
    type.includes("percent") ||
    type.includes("percentage") ||
    type.includes("%")
  ) {
    return `${offer.discount_value}% OFF`;
  }

  if (
    type.includes("fixed") ||
    type.includes("amount") ||
    type.includes("flat")
  ) {
    return `${formatMoney(offer.discount_value)} OFF`;
  }

  return String(offer.discount_value);
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

function getBusinessHref(business: Business | null) {
  if (!business) {
    return "/businesses";
  }

  return `/businesses/${business.slug || business.id}`;
}

async function getOffer(slug: string): Promise<{
  offer: Offer | null;
  business: Business | null;
}> {
  const supabase = await createSupabaseServerClient();

  const { data: offerData, error: offerError } = await supabase
    .from("offers")
    .select(
      [
        "id",
        "business_id",
        "title",
        "slug",
        "short_description",
        "description",
        "coupon_code",
        "offer_type",
        "discount_type",
        "discount_value",
        "minimum_order_amount",
        "maximum_discount_amount",
        "redemption_limit",
        "redemption_count",
        "per_user_limit",
        "start_at",
        "end_at",
        "visibility",
        "status",
        "priority",
        "is_featured",
        "terms_conditions",
        "created_at",
      ].join(", "),
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (offerError || !offerData) {
    return {
      offer: null,
      business: null,
    };
  }

  const offer = offerData as unknown as Offer;

  const { data: businesses } = await supabase.rpc(
    "get_public_businesses",
    {
      p_search: null,
      p_limit: 1000,
      p_offset: 0,
    },
  );

  const business =
    ((businesses ?? []) as Business[]).find(
      (item) => item.id === offer.business_id,
    ) ?? null;

  return {
    offer,
    business,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { offer, business } = await getOffer(slug);

  if (!offer) {
    return {
      title: "Offer Not Found | Twimzi",
    };
  }

  const title = `${offer.title} | Twimzi`;

  const description =
    offer.short_description?.trim() ||
    offer.description?.trim() ||
    `Discover this offer${
      business ? ` from ${business.business_name}` : ""
    } on Twimzi.`;

  const canonicalUrl = `https://www.twimzi.com/offers/${encodeURIComponent(
    offer.slug,
  )}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function OfferDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { offer, business } = await getOffer(slug);

  if (!offer) {
    notFound();
  }

  const discount = formatDiscount(offer);

  const description =
    offer.description?.trim() ||
    offer.short_description?.trim() ||
    "No offer description available.";

  const shortDescription =
    offer.short_description?.trim() ||
    "Discover this active offer from a local business on Twimzi.";

  const businessHref = getBusinessHref(business);

  const offerUrl = `https://www.twimzi.com/offers/${encodeURIComponent(
    offer.slug,
  )}`;

  const businessUrl = business
    ? `https://www.twimzi.com${getBusinessHref(business)}`
    : undefined;

  const remainingRedemptions =
    offer.redemption_limit !== null && offer.redemption_count !== null
      ? Math.max(offer.redemption_limit - offer.redemption_count, 0)
      : null;

  const offerSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: offer.title,
    description: shortDescription,
    url: offerUrl,
    availability: "https://schema.org/InStock",
  };

  if (offer.start_at) {
    offerSchema.validFrom = offer.start_at;
  }

  if (offer.end_at) {
    offerSchema.validThrough = offer.end_at;
  }

  if (business) {
    offerSchema.seller = {
      "@type": "LocalBusiness",
      name: business.business_name,
      ...(businessUrl ? { url: businessUrl } : {}),
    };
  }

  const additionalProperties: Array<Record<string, unknown>> = [];

  if (offer.offer_type) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Offer type",
      value: offer.offer_type,
    });
  }

  if (offer.discount_type && offer.discount_value !== null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Discount",
      value: discount ?? String(offer.discount_value),
    });
  }

  if (offer.coupon_code) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Coupon code",
      value: offer.coupon_code,
    });
  }

  if (offer.minimum_order_amount !== null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Minimum order amount",
      value: offer.minimum_order_amount,
      unitText: "INR",
    });
  }

  if (offer.maximum_discount_amount !== null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Maximum discount amount",
      value: offer.maximum_discount_amount,
      unitText: "INR",
    });
  }

  if (offer.per_user_limit !== null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Per user limit",
      value: offer.per_user_limit,
    });
  }

  if (additionalProperties.length > 0) {
    offerSchema.additionalProperty = additionalProperties;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <StructuredData data={offerSchema} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Offers
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-slate-100 p-8 sm:min-h-[480px]">
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                  <Gift className="h-14 w-14" />
                </div>

                {discount ? (
                  <p className="mt-7 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                    {discount}
                  </p>
                ) : (
                  <p className="mt-7 text-2xl font-extrabold text-slate-950">
                    Special Offer
                  </p>
                )}
              </div>

              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                {offer.is_featured ? (
                  <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
                    Featured
                  </span>
                ) : null}

                {offer.offer_type ? (
                  <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-bold capitalize text-slate-900 backdrop-blur">
                    {offer.offer_type}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Gift className="h-4 w-4" />
              Offer
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {offer.title}
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-600">
              {shortDescription}
            </p>

            {discount ? (
              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-extrabold text-slate-950">
                  {discount}
                </p>

                {offer.maximum_discount_amount !== null ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Maximum discount:{" "}
                    {formatMoney(offer.maximum_discount_amount)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {offer.coupon_code ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-600">
                    Coupon Code
                  </span>
                </div>

                <code className="mt-3 block rounded-xl bg-slate-100 px-4 py-3 text-center text-xl font-extrabold tracking-[0.12em] text-slate-950">
                  {offer.coupon_code}
                </code>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={businessHref}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Store className="h-4 w-4" />
                View Business
              </Link>

              <Link
                href="/offers"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                More Offers
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-slate-500" />
              <h2 className="text-xl font-bold text-slate-950">
                Offer Details
              </h2>
            </div>

            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {description}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">Starts</p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {formatDate(offer.start_at)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">Ends</p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {formatDate(offer.end_at)}
                </p>
              </div>

              {offer.minimum_order_amount !== null ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Minimum Order
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatMoney(offer.minimum_order_amount)}
                  </p>
                </div>
              ) : null}

              {offer.per_user_limit !== null ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Per User Limit
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {offer.per_user_limit}
                  </p>
                </div>
              ) : null}
            </div>

            {remainingRedemptions !== null ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-900">
                  {remainingRedemptions} redemption
                  {remainingRedemptions === 1 ? "" : "s"} remaining
                </span>
              </div>
            ) : null}

            {offer.terms_conditions?.trim() ? (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-lg font-bold text-slate-950">
                  Terms & Conditions
                </h2>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {offer.terms_conditions.trim()}
                </div>
              </div>
            ) : null}
          </article>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Store className="h-5 w-5 text-slate-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Offered by
                </p>

                <p className="truncate text-base font-bold text-slate-950">
                  {business?.business_name || "Business"}
                </p>
              </div>
            </div>

            <Link
              href={businessHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Visit Business
            </Link>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                Valid until {formatDateTime(offer.end_at)}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}