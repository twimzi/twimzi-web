import Link from "next/link";
import {
  BriefcaseBusiness,
  Car,
  Cog,
  Factory,
  GraduationCap,
  HardHat,
  House,
  Laptop,
  MapPin,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Utensils,
  Wheat,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
};

type Category = {
  id: string;
  parent_id: string | null;
  category_code: string;
  category_name: string;
  slug: string | null;
  description: string | null;
  icon_name: string | null;
  image_media_id: string | null;
  sort_order: number | null;
  is_featured: boolean;
};

type Business = {
  id: string;
  business_code: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  business_type_id: string | null;
  verification_status: string;
  business_status: string;
  city: string | null;
  state: string | null;
  is_featured: boolean;
  created_at: string;
};

const quickLinks = [
  {
    title: "All Businesses",
    description: "Browse businesses available on Twimzi.",
    href: "/businesses",
  },
  {
    title: "Products",
    description: "Discover products from local businesses.",
    href: "/products",
  },
  {
    title: "Services",
    description: "Find services offered by local providers.",
    href: "/services",
  },
  {
    title: "Offers",
    description: "See current offers from businesses.",
    href: "/offers",
  },
];

function getCategoryIcon(category: Category) {
  const source = [
    category.icon_name,
    category.category_code,
    category.category_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    source.includes("agri") ||
    source.includes("farm") ||
    source.includes("tractor")
  ) {
    return Wheat;
  }

  if (
    source.includes("auto") ||
    source.includes("car") ||
    source.includes("vehicle")
  ) {
    return Car;
  }

  if (
    source.includes("beauty") ||
    source.includes("salon") ||
    source.includes("cosmetic")
  ) {
    return Sparkles;
  }

  if (
    source.includes("construction") ||
    source.includes("building")
  ) {
    return HardHat;
  }

  if (
    source.includes("education") ||
    source.includes("school") ||
    source.includes("college")
  ) {
    return GraduationCap;
  }

  if (
    source.includes("electronic") ||
    source.includes("technology") ||
    source.includes("tech")
  ) {
    return Laptop;
  }

  if (
    source.includes("fashion") ||
    source.includes("apparel") ||
    source.includes("clothing")
  ) {
    return ShoppingBag;
  }

  if (
    source.includes("food") ||
    source.includes("restaurant") ||
    source.includes("hospitality")
  ) {
    return Utensils;
  }

  if (
    source.includes("health") ||
    source.includes("medical") ||
    source.includes("hospital")
  ) {
    return Stethoscope;
  }

  if (
    source.includes("home") ||
    source.includes("house")
  ) {
    return House;
  }

  if (
    source.includes("industrial") ||
    source.includes("industry")
  ) {
    return Factory;
  }

  if (
    source.includes("professional") ||
    source.includes("business") ||
    source.includes("consult")
  ) {
    return BriefcaseBusiness;
  }

  if (
    source.includes("manufactur") ||
    source.includes("machin")
  ) {
    return Cog;
  }

  if (
    source.includes("retail") ||
    source.includes("shop")
  ) {
    return ShoppingCart;
  }

  if (
    source.includes("wholesale") ||
    source.includes("distribution") ||
    source.includes("trade")
  ) {
    return Package;
  }

  return MapPin;
}

function getCategoryDescription(category: Category) {
  if (category.description?.trim()) {
    return category.description.trim();
  }

  return `Discover businesses and offerings in ${category.category_name}.`;
}

function getCategoryHref(category: Category) {
  return `/businesses?category=${encodeURIComponent(category.id)}`;
}

function getBusinessHref(business: Business) {
  if (business.slug?.trim()) {
    return `/businesses/${business.slug}`;
  }

  return `/businesses/${business.id}`;
}

function getBusinessLocation(business: Business) {
  return [business.city, business.state]
    .filter((value) => value?.trim())
    .join(", ");
}

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const [categoriesResult, businessesResult] = await Promise.all([
    supabase.rpc("get_public_categories"),
    supabase.rpc("get_public_businesses", {
      p_search: search || null,
      p_limit: search ? 60 : 12,
      p_offset: 0,
    }),
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  const businesses = (businessesResult.data ?? []) as Business[];

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999),
  );

  return (
    <>
      <PageHero
        eyebrow="Explore"
        title={
          search
            ? `Search results for "${search}"`
            : "Find what you need, close to you."
        }
        description={
          search
            ? "Discover businesses matching your search across the existing Twimzi marketplace."
            : "Explore real Twimzi categories and discover businesses, products and services from one connected marketplace."
        }
      />

      <Container>
        {search ? (
          <section className="py-12">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  Search
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Businesses matching your search
                </h2>
              </div>

              <Link
                href="/explore"
                className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                Clear search
              </Link>
            </div>

            {businessesResult.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h3 className="font-bold text-red-900">
                  Unable to load search results
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  Search results could not be loaded right now. Please try
                  again shortly.
                </p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-10 text-center">
                <h3 className="text-lg font-bold">
                  No businesses found
                </h3>

                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  We could not find businesses matching &quot;{search}&quot;.
                  Try another search.
                </p>

                <Link
                  href="/businesses"
                  className="mt-5 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
                >
                  Browse all businesses
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => {
                  const location = getBusinessLocation(business);

                  return (
                    <Link
                      key={business.id}
                      href={getBusinessHref(business)}
                      className="group rounded-2xl border border-[var(--color-border)] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-lg)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-lg font-bold text-[var(--color-primary)]">
                          {business.business_name
                            .trim()
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>

                        {business.is_featured ? (
                          <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-5 line-clamp-2 text-lg font-bold transition group-hover:text-[var(--color-primary)]">
                        {business.business_name}
                      </h3>

                      {business.business_type ? (
                        <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
                          {business.business_type}
                        </p>
                      ) : null}

                      {business.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
                          {business.description}
                        </p>
                      ) : null}

                      {location ? (
                        <p className="mt-4 text-xs font-medium text-[var(--color-text-muted)]">
                          {location}
                        </p>
                      ) : null}

                      <span className="mt-5 block text-xs font-semibold text-[var(--color-primary)]">
                        View business →
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        <section className="py-12">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              Categories
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Explore by category
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
              These categories are loaded directly from the Twimzi database,
              so the website and Flutter app use the same category structure.
            </p>
          </div>

          {categoriesResult.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="font-bold text-red-900">
                Unable to load categories
              </h3>

              <p className="mt-2 text-sm leading-6 text-red-700">
                Categories could not be loaded right now. Please try again
                shortly.
              </p>
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-10 text-center">
              <h3 className="text-lg font-bold">
                No categories available
              </h3>

              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                There are currently no active public categories.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sortedCategories.map((category, index) => {
                const Icon = getCategoryIcon(category);

                const iconThemes = [
                  "bg-emerald-50 text-emerald-600",
                  "bg-sky-50 text-sky-600",
                  "bg-rose-50 text-rose-500",
                  "bg-amber-50 text-amber-600",
                  "bg-violet-50 text-violet-600",
                  "bg-blue-50 text-blue-600",
                  "bg-pink-50 text-pink-600",
                  "bg-orange-50 text-orange-600",
                ];

                const iconTheme =
                  iconThemes[index % iconThemes.length];

                return (
                  <Link
                    key={category.id}
                    href={getCategoryHref(category)}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-xs)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)] sm:p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.35rem] ${iconTheme} shadow-inner transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.8}
                          className="h-10 w-10"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-6 text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-dark)] sm:text-lg">
                          {category.category_name}
                        </h3>

                        <p className="mt-1 line-clamp-3 text-sm leading-5 text-[var(--color-text-muted)]">
                          {getCategoryDescription(category)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-primary)] transition-all group-hover:tracking-wide">
                        Explore category →
                      </span>

                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] opacity-40 transition-all group-hover:w-5 group-hover:rounded-full group-hover:opacity-100"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-t border-[var(--color-border)] py-12">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Quick access
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Start discovering
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Jump directly into the main Twimzi discovery areas.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]"
              >
                <h3 className="font-bold">{item.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {item.description}
                </p>

                <span className="mt-4 block text-xs font-semibold text-[var(--color-primary)]">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}