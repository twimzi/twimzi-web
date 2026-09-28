import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  is_featured: boolean | null;
  featured_until: string | null;
  total_followers: number | null;
};

function getBusinessUrl(business: Business) {
  return business.slug
    ? `/businesses/${business.slug}`
    : `/businesses/${business.id}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "T";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)]">
      <div className="h-24 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-accent-light)]" />

      <div className="relative px-5 pb-5">
        <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-[var(--color-primary-light)] text-lg font-bold text-[var(--color-primary)] shadow-md">
          {getInitials(business.business_name)}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          {business.business_type || "Local Business"}
        </p>

        <h3 className="mt-1 line-clamp-2 text-lg font-bold text-[var(--color-text)]">
          {business.business_name}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--color-text-muted)]">
          {business.description ||
            "Business profile, products, services, offers and updates."}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          {business.total_followers !== null ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text)]">
                {business.total_followers}
              </strong>{" "}
              followers
            </span>
          ) : (
            <span />
          )}

          <Link
            href={getBusinessUrl(business)}
            className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            View business →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BusinessSections({
  featured,
  latest,
}: {
  featured: Business[];
  latest: Business[];
}) {
  return (
    <>
      {featured.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading
              eyebrow="Featured"
              title="Featured Businesses"
              description="Discover businesses currently highlighted on Twimzi."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/businesses"
                className="inline-flex rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Explore All Businesses →
              </Link>
            </div>
          </Container>
        </section>
      )}

      {latest.length > 0 && (
        <section className="bg-[var(--color-secondary)] py-20">
          <Container>
            <SectionHeading
              eyebrow="New on Twimzi"
              title="Latest Businesses Added"
              description="See the newest businesses joining the Twimzi local business network."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {latest.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/businesses"
                className="inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Discover More Businesses →
              </Link>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}