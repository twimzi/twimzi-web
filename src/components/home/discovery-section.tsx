import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Eye,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  average_rating: number | null;
  total_followers: number | null;
  total_views: number | null;
  is_featured: boolean | null;
  featured_until: string | null;
  created_at: string;
};

function isFeatured(business: Business) {
  if (!business.is_featured) {
    return false;
  }

  if (!business.featured_until) {
    return true;
  }

  return new Date(business.featured_until).getTime() > Date.now();
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "T";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function BusinessCard({
  business,
  featured = false,
}: {
  business: Business;
  featured?: boolean;
}) {
  const href = business.slug
    ? `/businesses/${business.slug}`
    : `/businesses/${business.id}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)]">
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)] via-white to-[var(--color-accent-light)]">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[var(--color-primary-light)] opacity-80 blur-3xl transition-transform duration-500 group-hover:scale-125"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-[var(--color-accent-light)] opacity-70 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute right-5 top-5 h-16 w-16 rounded-2xl border border-white/70 bg-white/30 backdrop-blur-sm"
        />

        {featured ? (
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Featured
          </div>
        ) : null}
      </div>

      <div className="relative px-5 pb-5">
        <div className="-mt-9 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-white bg-[var(--color-primary-light)] text-lg font-extrabold text-[var(--color-primary)] shadow-[var(--shadow-md)] transition-transform duration-300 group-hover:scale-105">
          {getInitials(business.business_name)}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-primary)]">
              {business.business_type || "Local Business"}
            </p>

            <h3 className="mt-1.5 line-clamp-2 text-lg font-extrabold leading-6 text-[var(--color-text)]">
              {business.business_name}
            </h3>
          </div>

          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)] transition-colors duration-200 group-hover:bg-[var(--color-primary)] group-hover:text-white"
          >
            <Building2 className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {business.description ||
            "Discover products, services, offers and updates from this local business."}
        </p>

        <div className="mt-4 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-muted)]">
          {business.total_followers !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <strong className="text-[var(--color-text)]">
                {business.total_followers.toLocaleString()}
              </strong>
              followers
            </span>
          ) : null}

          {business.average_rating !== null &&
          business.average_rating > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current text-[var(--color-accent)]" />
              <strong className="text-[var(--color-text)]">
                {Number(business.average_rating).toFixed(1)}
              </strong>
            </span>
          ) : null}

          {business.total_views !== null && business.total_views > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {business.total_views.toLocaleString()}
            </span>
          ) : null}
        </div>

        <Link
          href={href}
          className="mt-5 flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-primary)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] hover:shadow-[var(--shadow-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          View business
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

function DiscoveryGroupHeader({
  eyebrow,
  title,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  hrefLabel: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          {eyebrow}
        </p>

        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl">
          {title}
        </h2>
      </div>

      <Link
        href="/businesses"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-white hover:text-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        {hrefLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function DiscoverySection({
  businesses,
}: {
  businesses: Business[];
}) {
  const featuredBusinesses = businesses
    .filter(isFeatured)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 3);

  const recentBusinesses = [...businesses]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)] py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary-light)] opacity-40 blur-3xl"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Discover local"
          title="Businesses worth discovering"
          description="Explore recently added businesses and businesses currently featured on Twimzi."
        />

        {featuredBusinesses.length > 0 ? (
          <div className="mt-10 sm:mt-12">
            <DiscoveryGroupHeader
              eyebrow="Featured businesses"
              title="Featured on Twimzi"
              hrefLabel="View all"
            />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredBusinesses.map((business) => (
                <BusinessCard
                  key={`featured-${business.id}`}
                  business={business}
                  featured
                />
              ))}
            </div>
          </div>
        ) : null}

        {recentBusinesses.length > 0 ? (
          <div
            className={
              featuredBusinesses.length > 0
                ? "mt-14 sm:mt-16"
                : "mt-10 sm:mt-12"
            }
          >
            <DiscoveryGroupHeader
              eyebrow="Recently added"
              title="New businesses"
              hrefLabel="Explore all"
            />

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recentBusinesses.map((business) => (
                <BusinessCard
                  key={`recent-${business.id}`}
                  business={business}
                />
              ))}
            </div>
          </div>
        ) : null}

        {businesses.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[var(--color-border)] bg-white px-6 py-14 text-center shadow-[var(--shadow-sm)] sm:mt-12 sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
              <MapPin className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">
              Businesses are coming to Twimzi
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
              Discover local businesses as they join the Twimzi platform.
            </p>

            <Link
              href="/add-business"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              Add your business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </Container>
    </section>
  );
}