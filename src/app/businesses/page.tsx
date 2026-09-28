import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CarFront,
  CheckCircle2,
  GraduationCap,
  HardHat,
  HeartPulse,
  House,
  Laptop,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Tractor,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Businesses | Twimzi",
  description:
    "Discover verified local businesses, manufacturers, traders, professionals, shops and service providers on Twimzi.",
};

type SearchParams = {
  q?: string;
  category?: string;
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

function getBusinessHref(business: Business) {
  return business.slug?.trim()
    ? `/businesses/${business.slug}`
    : `/businesses/${business.id}`;
}

function getLocation(business: Business) {
  return [business.city, business.state]
    .filter((value) => value?.trim())
    .join(", ");
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function isVerified(business: Business) {
  const status = business.verification_status?.toLowerCase() ?? "";

  return (
    status === "verified" ||
    status === "approved" ||
    status === "active"
  );
}

function getCategoryIcon(category: Category): LucideIcon {
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
    return Tractor;
  }

  if (
    source.includes("auto") ||
    source.includes("vehicle") ||
    source.includes("car") ||
    source.includes("automobile")
  ) {
    return CarFront;
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
    source.includes("builder") ||
    source.includes("building")
  ) {
    return HardHat;
  }

  if (
    source.includes("education") ||
    source.includes("school") ||
    source.includes("college") ||
    source.includes("training")
  ) {
    return GraduationCap;
  }

  if (
    source.includes("electronic") ||
    source.includes("technology") ||
    source.includes("tech") ||
    source.includes("computer")
  ) {
    return Laptop;
  }

  if (
    source.includes("fashion") ||
    source.includes("cloth") ||
    source.includes("apparel") ||
    source.includes("textile")
  ) {
    return Shirt;
  }

  if (
    source.includes("food") ||
    source.includes("restaurant") ||
    source.includes("cafe") ||
    source.includes("bakery")
  ) {
    return UtensilsCrossed;
  }

  if (
    source.includes("health") ||
    source.includes("medical") ||
    source.includes("hospital") ||
    source.includes("doctor")
  ) {
    return HeartPulse;
  }

  if (
    source.includes("home") ||
    source.includes("house") ||
    source.includes("interior")
  ) {
    return House;
  }

  return Sparkles;
}

function BusinessCard({ business }: { business: Business }) {
  const location = getLocation(business);
  const verified = isVerified(business);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)]">
      <Link href={getBusinessHref(business)} className="block">
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[var(--color-secondary)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-primary-light)] opacity-70 transition duration-300 group-hover:scale-125" />

          <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-[var(--color-accent-light)] opacity-50 transition duration-300 group-hover:scale-110" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/80 bg-white text-2xl font-extrabold text-[var(--color-primary-dark)] shadow-[var(--shadow-md)]">
            {getInitials(business.business_name)}
          </div>

          {business.is_featured ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white shadow-[var(--shadow-accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </span>
          ) : null}

          {verified ? (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)] shadow-sm backdrop-blur">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
              Verified
            </span>
          ) : null}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-lg font-bold leading-6 text-[var(--color-text)] transition group-hover:text-[var(--color-primary-dark)]">
                {business.business_name}
              </h2>

              {business.business_type ? (
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  {business.business_type}
                </p>
              ) : null}
            </div>

            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[var(--color-text-light)] transition group-hover:translate-x-1 group-hover:text-[var(--color-primary)]" />
          </div>

          {business.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {business.description}
            </p>
          ) : null}

          {location ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              <span className="truncate">{location}</span>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const categoryId = params.category?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const [categoriesResult, businessesResult] = await Promise.all([
    supabase.rpc("get_public_categories"),
    supabase.rpc("get_public_businesses", {
      p_search: search || null,
      p_limit: 60,
      p_offset: 0,
    }),
  ]);

  const categories = (categoriesResult.data ?? []) as Category[];
  let businesses = (businessesResult.data ?? []) as Business[];
  let categoryError = false;

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999),
  );

  const selectedCategory = sortedCategories.find(
    (category) => category.id === categoryId,
  );

  if (categoryId) {
    const categoryResult = await supabase.rpc(
      "get_public_businesses_by_category",
      {
        p_category_id: categoryId,
        p_limit: 60,
        p_offset: 0,
      },
    );

    if (categoryResult.error) {
      categoryError = true;
      businesses = [];
    } else if (categoryResult.data) {
      businesses = categoryResult.data as Business[];

      if (search) {
        const query = search.toLowerCase();

        businesses = businesses.filter((business) =>
          [
            business.business_name,
            business.description,
            business.business_type,
            business.city,
            business.state,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(query),
            ),
        );
      }
    }
  }

  const title = selectedCategory
    ? selectedCategory.category_name
    : search
      ? `Search results for "${search}"`
      : "Discover Businesses";

  return (
    <>
      <PageHero
        eyebrow="Businesses"
        title={title}
        description={
          selectedCategory
            ? `Discover businesses listed under ${selectedCategory.category_name} on Twimzi.`
            : search
              ? "Find businesses matching your search across the Twimzi marketplace."
              : "Discover local businesses, manufacturers, traders, professionals, shops and service providers."
        }
      />

      <Container>
        <section className="py-8 sm:py-12">
          <form
            method="get"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-md)] sm:flex sm:items-center sm:gap-3 sm:p-4"
          >
            {categoryId ? (
              <input type="hidden" name="category" value={categoryId} />
            ) : null}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-primary)]" />

              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search businesses..."
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10"
              />
            </div>

            <button
              type="submit"
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-7 text-sm font-bold text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--color-primary-dark)] sm:mt-0 sm:w-auto"
            >
              Search
            </button>
          </form>

          {/* Category navigation */}
          <div className="relative z-10 mt-7">
            <div className="twimzi-horizontal-scroll -mx-1 px-1 pb-3">
              <div className="flex min-w-max items-center gap-2">
                {/* All */}
                <Link
                  href={
                    search
                      ? `/businesses?q=${encodeURIComponent(search)}`
                      : "/businesses"
                  }
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    !categoryId
                      ? "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]"
                      : "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                  }`}
                >
                  <Sparkles
                    className={`h-4 w-4 ${
                      !categoryId
                        ? "text-white"
                        : "text-[var(--color-primary)]"
                    }`}
                  />
                  All
                </Link>

                {sortedCategories.map((category) => {
                  const CategoryIcon = getCategoryIcon(category);
                  const isSelected = category.id === categoryId;

                  const href = search
                    ? `/businesses?category=${encodeURIComponent(
                        category.id,
                      )}&q=${encodeURIComponent(search)}`
                    : `/businesses?category=${encodeURIComponent(
                        category.id,
                      )}`;

                  return (
                    <Link
                      key={category.id}
                      href={href}
                      aria-current={isSelected ? "page" : undefined}
                      className={`group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                        isSelected
                          ? "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]"
                          : "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                      }`}
                    >
                      <CategoryIcon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected
                            ? "text-white"
                            : "text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)]"
                        }`}
                        strokeWidth={1.9}
                      />

                      <span>{category.category_name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Subtle scroll indicator on mobile */}
            {sortedCategories.length > 4 ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent sm:hidden"
              />
            ) : null}
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                Directory
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                {selectedCategory
                  ? selectedCategory.category_name
                  : search
                    ? "Matching businesses"
                    : "Businesses on Twimzi"}
              </h2>
            </div>

            {!categoryError ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                {businesses.length}{" "}
                {businesses.length === 1 ? "business" : "businesses"}
              </p>
            ) : null}
          </div>

          {categoryError ? (
            <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-8">
              <h3 className="font-bold text-[var(--color-error)]">
                Unable to load businesses
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Businesses for this category could not be loaded right now.
                Please try again shortly.
              </p>

              <Link
                href="/businesses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--color-primary-dark)]"
              >
                Browse all businesses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : businessesResult.error && !categoryId ? (
            <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-8">
              <h3 className="font-bold text-[var(--color-error)]">
                Unable to load businesses
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Businesses could not be loaded right now. Please try again
                shortly.
              </p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-sm)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Building2 className="h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-[var(--color-text)]">
                No businesses found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
                Try a different search or choose another category.
              </p>

              <Link
                href="/businesses"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--color-primary-dark)]"
              >
                Browse all businesses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}
        </section>
      </Container>
    </>
  );
}