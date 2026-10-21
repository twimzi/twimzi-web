import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

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

type BusinessMedia = {
  logo_bucket_name: string | null;
  logo_object_path: string | null;
  logo_is_public: boolean | null;
  cover_bucket_name: string | null;
  cover_object_path: string | null;
  cover_is_public: boolean | null;
};

type BusinessCardData = Business & {
  logoUrl: string | null;
  coverUrl: string | null;
};

function getStoragePublicUrl(
  bucketName: string | null,
  objectPath: string | null,
  isPublic: boolean | null,
): string | null {
  if (!bucketName || !objectPath || isPublic !== true) return null;

  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${siteConfig.media.publicUrl.replace(/\/$/, "")}/media/${encodedPath}`;
}

function getBusinessUrl(business: Business) {
  return business.slug
    ? `/businesses/${business.slug}`
    : `/businesses/${business.id}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\\s+/).filter(Boolean);

  if (words.length === 0) return "T";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function BusinessCard({ business }: { business: BusinessCardData }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:-translate-y-1 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-lg)]">
      <Link href={getBusinessUrl(business)} className="block">
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-accent-light)]">
          {business.coverUrl ? (
            <Image
              src={business.coverUrl}
              alt={`${business.business_name} cover`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : null}
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[var(--color-primary-light)] text-lg font-bold text-[var(--color-primary)] shadow-md">
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={`${business.business_name} logo`}
                width={64}
                height={64}
                sizes="64px"
                className="h-full w-full object-contain bg-white p-1"
              />
            ) : (
              getInitials(business.business_name)
            )}
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

            <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:underline">
              View business →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

async function addPublicMedia(
  businesses: Business[],
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<BusinessCardData[]> {
  return Promise.all(
    businesses.map(async (business) => {
      const { data, error } = await supabase.rpc("get_public_business_media", {
        p_business_id: business.id,
      });

      const media =
        !error && Array.isArray(data) && data.length > 0
          ? (data[0] as BusinessMedia)
          : null;

      return {
        ...business,
        logoUrl: getStoragePublicUrl(
          media?.logo_bucket_name ?? null,
          media?.logo_object_path ?? null,
          media?.logo_is_public ?? null,
        ),
        coverUrl: getStoragePublicUrl(
          media?.cover_bucket_name ?? null,
          media?.cover_object_path ?? null,
          media?.cover_is_public ?? null,
        ),
      };
    }),
  );
}

export async function BusinessSections({
  featured,
  latest,
}: {
  featured: Business[];
  latest: Business[];
}) {
  const supabase = await createSupabaseServerClient();
  const allBusinesses = [
    ...new Map(
      [...featured, ...latest].map((business) => [business.id, business]),
    ).values(),
  ];
  const businessesWithMedia = await addPublicMedia(allBusinesses, supabase);
  const mediaById = new Map(
    businessesWithMedia.map((business) => [business.id, business]),
  );
  const featuredWithMedia = featured.map(
    (business) => mediaById.get(business.id) ?? { ...business, logoUrl: null, coverUrl: null },
  );
  const latestWithMedia = latest.map(
    (business) => mediaById.get(business.id) ?? { ...business, logoUrl: null, coverUrl: null },
  );

  return (
    <>
      {featuredWithMedia.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading
              eyebrow="Featured"
              title="Featured Businesses"
              description="Discover businesses currently highlighted on Twimzi."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredWithMedia.map((business) => (
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

      {latestWithMedia.length > 0 && (
        <section className="bg-[var(--color-secondary)] py-20">
          <Container>
            <SectionHeading
              eyebrow="New on Twimzi"
              title="Latest Businesses Added"
              description="See the newest businesses joining the Twimzi local business network."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {latestWithMedia.map((business) => (
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
