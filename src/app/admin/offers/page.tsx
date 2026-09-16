import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Offer = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  coupon_code: string | null;
  offer_type: string;
  discount_type: string | null;
  discount_value: number | null;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  redemption_limit: number | null;
  redemption_count: number | null;
  per_user_limit: number | null;
  start_at: string;
  end_at: string;
  visibility: string | null;
  status: string;
  priority: number | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

type Business = {
  id: string;
  business_name: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function AdminOffers({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_super_admin");

  if (!isAdmin) {
    redirect("/");
  }

  let query = supabase
    .from("offers")
    .select(
      `
        id,
        business_id,
        title,
        slug,
        short_description,
        coupon_code,
        offer_type,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        redemption_limit,
        redemption_count,
        per_user_limit,
        start_at,
        end_at,
        visibility,
        status,
        priority,
        is_featured,
        is_active,
        created_at
      `,
    )
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,short_description.ilike.%${search}%,coupon_code.ilike.%${search}%,offer_type.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  const offers = (data ?? []) as Offer[];

  const businessIds = [
    ...new Set(offers.map((offer) => offer.business_id)),
  ];

  let businesses: Business[] = [];

  if (businessIds.length > 0) {
    const { data: businessData } = await supabase
      .from("businesses")
      .select("id, business_name")
      .in("id", businessIds);

    businesses = (businessData ?? []) as Business[];
  }

  const businessMap = new Map(
    businesses.map((business) => [
      business.id,
      business.business_name,
    ]),
  );

  const activeCount = offers.filter(
    (offer) => offer.status === "active" && offer.is_active,
  ).length;

  const draftCount = offers.filter(
    (offer) => offer.status === "draft",
  ).length;

  const pausedCount = offers.filter(
    (offer) => offer.status === "paused",
  ).length;

  const featuredCount = offers.filter(
    (offer) => offer.is_featured,
  ).length;

  const redemptionCount = offers.reduce(
    (total, offer) => total + (offer.redemption_count ?? 0),
    0,
  );

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Growth
          </p>

          <h1 className="mt-1 text-3xl font-extrabold">
            Offers
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage business offers, promotions, visibility and redemptions.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search offer, coupon or type..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Offers Loaded"
          value={offers.length}
        />

        <StatCard
          label="Active"
          value={activeCount}
        />

        <StatCard
          label="Draft"
          value={draftCount}
        />

        <StatCard
          label="Featured"
          value={featuredCount}
        />

        <StatCard
          label="Redemptions"
          value={redemptionCount}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load offers.
          </p>

          <p className="mt-1">
            The current Offers table access does not allow administration from
            this page.
          </p>

          <p className="mt-2 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full text-left text-sm">
                <thead className="border-b bg-[var(--color-surface)]">
                  <tr>
                    <th className="px-5 py-4 font-bold">
                      Offer
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Business
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Type
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Discount
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Validity
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Redemptions
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Priority
                    </th>

                    <th className="px-5 py-4 font-bold">
                      Featured
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
                  {offers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-5 py-14 text-center text-sm text-[var(--color-text-muted)]"
                      >
                        {search || status
                          ? "No offers matched your filters."
                          : "No offers found."}
                      </td>
                    </tr>
                  ) : (
                    offers.map((offer) => (
                      <tr
                        key={offer.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <p className="font-bold text-slate-900">
                              {offer.title || "Untitled offer"}
                            </p>

                            {offer.short_description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                                {offer.short_description}
                              </p>
                            ) : null}

                            {offer.coupon_code ? (
                              <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                                {offer.coupon_code}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/businesses/${offer.business_id}`}
                            className="font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            {businessMap.get(offer.business_id) ??
                              "Unknown Business"}
                          </Link>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {offer.business_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                            {formatLabel(offer.offer_type)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {formatDiscount(offer)}
                          </p>

                          {offer.minimum_order_amount !== null ? (
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              Min â‚¹
                              {formatNumber(
                                offer.minimum_order_amount,
                              )}
                            </p>
                          ) : null}

                          {offer.maximum_discount_amount !== null ? (
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              Max â‚¹
                              {formatNumber(
                                offer.maximum_discount_amount,
                              )}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-slate-700">
                            {formatDate(offer.start_at)}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            to {formatDate(offer.end_at)}
                          </p>

                          <p className="mt-2 text-[10px] capitalize text-slate-400">
                            {offer.visibility || "public"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {offer.redemption_count ?? 0}
                          </p>

                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {offer.redemption_limit &&
                            offer.redemption_limit > 0
                              ? `of ${offer.redemption_limit}`
                              : "Unlimited"}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            Per user:{" "}
                            {offer.per_user_limit ?? 1}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold">
                            {offer.priority ?? 0}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <BooleanBadge
                            value={offer.is_featured}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={offer.status}
                            active={offer.is_active}
                          />
                        </td>

                        <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                          {formatDate(offer.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {offers.length > 0 ? (
              <div className="flex flex-wrap gap-4 border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
                <span>
                  Showing up to 100 offers
                </span>

                <span>â€¢</span>

                <span>
                  {activeCount} active
                </span>

                <span>â€¢</span>

                <span>
                  {draftCount} draft
                </span>

                <span>â€¢</span>

                <span>
                  {pausedCount} paused
                </span>

                <span>â€¢</span>

                <span>
                  {featuredCount} featured
                </span>
              </div>
            ) : null}
          </div>
        </>
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
}: {
  value: boolean;
}) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function StatusBadge({
  status,
  active,
}: {
  status: string;
  active: boolean;
}) {
  if (!active) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold capitalize text-red-700">
        Inactive
      </span>
    );
  }

  const styles: Record<string, string> = {
    active:
      "bg-emerald-50 text-emerald-700",
    draft:
      "bg-slate-100 text-slate-600",
    paused:
      "bg-amber-50 text-amber-700",
    expired:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDiscount(offer: Offer) {
  if (
    offer.discount_value === null ||
    offer.discount_value === undefined
  ) {
    return "â€”";
  }

  if (offer.discount_type === "percentage") {
    return `${formatNumber(offer.discount_value)}%`;
  }

  if (offer.discount_type === "fixed") {
    return `â‚¹${formatNumber(offer.discount_value)}`;
  }

  return formatNumber(offer.discount_value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
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
