import Link from "next/link";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Business = {
  id: string;
  business_code: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  business_type_id: string | null;
  logo_media_id: string | null;
  cover_media_id: string | null;
  website: string | null;
  established_year: number | null;
  verification_status: string;
  business_status: string;
  average_rating: number | null;
  total_reviews: number | null;
  total_followers: number | null;
  total_views: number | null;
  public_handle: string | null;
  share_url: string | null;
  profile_completion: number | null;
  is_featured: boolean | null;
  featured_until: string | null;
  boost_until: string | null;
  priority_score: number | null;
  created_at: string;
  updated_at: string;
};

type BusinessesPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

function getBusinessInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "T";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function isFeatured(business: Business) {
  if (!business.is_featured) {
    return false;
  }

  if (!business.featured_until) {
    return true;
  }

  return new Date(business.featured_until).getTime() > Date.now();
}

export default async function Businesses({
  searchParams,
}: BusinessesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const type = params.type?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_businesses", {
    p_search: query || null,
    p_limit: 100,
    p_offset: 0,
  });

  let businesses = (data ?? []) as Business[];

  if (type) {
    const normalizedType = type.toLowerCase();

    businesses = businesses.filter((business) => {
      const businessType = business.business_type?.toLowerCase() ?? "";

      return (
        businessType.includes(normalizedType) ||
        normalizedType.includes(businessType)
      );
    });
  }

  return (
    <>
      <PageHero
        eyebrow="Businesses"
        title="Discover local businesses."
        description="Find businesses, suppliers, professionals, shops and service providers."
      />

      <Container>
        <form action="/businesses" method="get" className="py-8">
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search businesses, products or services..."
              className="min-h-12 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              aria-label="Search businesses"
            />

            <select
              name="type"
              defaultValue={type}
              className="min-h-12 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none focus:border-[var(--color-primary)]"
              aria-label="Business type"
            >
              <option value="">All business types</option>
              <option value="manufacturer">Manufacturers</option>
              <option value="trader">Traders & Wholesalers</option>
              <option value="professional">Professionals</option>
              <option value="home service">Home Services</option>
              <option value="shop">Local Shops</option>
              <option value="restaurant">Restaurants</option>
              <option value="dealer">Dealers</option>
              <option value="service">Service Providers</option>
            </select>

            <button
              type="submit"
              className="min-h-12 rounded-xl bg-[var(--color-primary)] px-7 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Search
            </button>

            {(query || type) && (
              <Link
                href="/businesses"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-border)] px-5 text-sm font-semibold"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {error ? (
          <div className="py-20">
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-red-600 shadow-sm">
                !
              </div>

              <h2 className="mt-5 text-xl font-bold text-red-900">
                Unable to load businesses
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-700">
                Businesses could not be loaded right now. Please try again
                shortly.
              </p>
            </div>
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-xl font-bold text-[var(--color-primary)]">
              T
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              No businesses found.
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
              Try another search or business type, or add your business to
              Twimzi.
            </p>

            <Link
              href="/add-business"
              className="mt-6 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Add your business
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 border-b border-[var(--color-border)] py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                {businesses.length}{" "}
                {businesses.length === 1 ? "business" : "businesses"} found
                {query ? ` for “${query}”` : ""}
              </p>

              <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Approved businesses
              </span>
            </div>

            <div className="grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => {
                const businessUrl = business.slug
                  ? `/businesses/${business.slug}`
                  : `/businesses/${business.id}`;

                const featured = isFeatured(business);
                const initials = getBusinessInitials(business.business_name);

                return (
                  <article
                    key={business.id}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)]"
                  >
                    {featured && (
                      <div className="absolute right-4 top-4 z-10 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Featured
                      </div>
                    )}

                    <div className="h-28 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-accent-light)]" />

                    <div className="relative px-6 pb-6">
                      <div className="-mt-9 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[var(--color-primary-light)] text-lg font-bold text-[var(--color-primary)] shadow-md">
                        {initials}
                      </div>

                      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                        {business.business_type || "Local Business"}
                      </p>

                      <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-[var(--color-text)]">
                        {business.business_name}
                      </h2>

                      <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--color-text-muted)]">
                        {business.description ||
                          "Business profile, products, services, offers and updates."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
                        {business.total_followers !== null && (
                          <span>
                            <strong className="text-[var(--color-text)]">
                              {business.total_followers}
                            </strong>{" "}
                            followers
                          </span>
                        )}

                        {business.total_views !== null && (
                          <span>
                            <strong className="text-[var(--color-text)]">
                              {business.total_views}
                            </strong>{" "}
                            views
                          </span>
                        )}

                        {business.average_rating !== null &&
                          business.average_rating > 0 && (
                            <span>
                              <strong className="text-[var(--color-text)]">
                                ★{" "}
                                {Number(business.average_rating).toFixed(1)}
                              </strong>
                            </span>
                          )}
                      </div>

                      <Link
                        href={businessUrl}
                        className="mt-5 flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        View business
                        <span className="ml-2 transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </Container>
    </>
  );
}