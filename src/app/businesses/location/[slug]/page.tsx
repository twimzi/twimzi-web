import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StructuredData } from "@/components/seo/structured-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  updated_at?: string | null;
};

type BusinessLocation = {
  business_id: string;
  city: string;
  state: string;
};

type PageProps = { params: Promise<{ slug: string }> };

function slugPart(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function getLocationSlug(location: BusinessLocation) {
  return `${slugPart(location.city)}-${slugPart(location.state)}`;
}

async function getLocationBusinesses(slug: string) {
  const supabase = await createSupabaseServerClient();
  const normalizedSlug = slugPart(slug);

  const [{ data: locationData, error: locationError }, { data: businessData, error: businessError }] =
    await Promise.all([
      supabase.rpc("get_public_business_locations"),
      supabase.rpc("get_public_businesses", {
        p_search: null,
        p_limit: 100,
        p_offset: 0,
      }),
    ]);

  if (locationError) console.error("Failed to load public business locations:", locationError);
  if (businessError) console.error("Failed to load public businesses for location page:", businessError);

  const locations = (locationData ?? []) as BusinessLocation[];
  const businesses = (businessData ?? []) as Business[];
  const locationByBusinessId = new Map(locations.map((item) => [item.business_id, item]));
  const matchingLocations = locations.filter((item) => getLocationSlug(item) === normalizedSlug);
  const matchingIds = new Set(matchingLocations.map((item) => item.business_id));
  const matchedBusinesses = businesses.filter((business) => matchingIds.has(business.id));
  const firstLocation = matchingLocations[0];

  return {
    businesses: matchedBusinesses,
    location: firstLocation ? `${firstLocation.city}, ${firstLocation.state}` : "",
    locationByBusinessId,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { businesses, location } = await getLocationBusinesses(slug);

  if (!businesses.length || !location) {
    return { title: "Location Not Found | Twimzi", robots: { index: false, follow: true } };
  }

  const canonical = `${siteConfig.url}/businesses/location/${encodeURIComponent(slugPart(slug))}`;
  const title = `Businesses in ${location} | Twimzi`;
  const description = `Discover local businesses, shops, manufacturers, traders, professionals and service providers in ${location} on Twimzi.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function BusinessLocationPage({ params }: PageProps) {
  const { slug } = await params;
  const { businesses, location } = await getLocationBusinesses(slug);

  if (!businesses.length || !location) notFound();

  const canonical = `${siteConfig.url}/businesses/location/${encodeURIComponent(slugPart(slug))}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Businesses", item: `${siteConfig.url}/businesses` },
      { "@type": "ListItem", position: 3, name: location, item: canonical },
    ],
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Businesses in ${location} on Twimzi`,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Twimzi", url: siteConfig.url },
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:underline">Home</Link>
        {" / "}
        <Link href="/businesses" className="hover:underline">Businesses</Link>
        {" / "}
        <span aria-current="page">{location}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">Explore by location</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          Businesses in {location}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
          Discover public business profiles in {location}, including local shops, manufacturers, traders, professionals and service providers listed on Twimzi.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{businesses.length} public listings</p>
      </header>

      <section aria-labelledby="location-listings-heading">
        <h2 id="location-listings-heading" className="mb-5 text-2xl font-bold">Explore local businesses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => {
            const href = `/businesses/${encodeURIComponent(business.slug?.trim() || business.id)}`;
            return (
              <article key={business.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-md">
                <h3 className="text-lg font-bold"><Link href={href} className="hover:text-[var(--color-primary)] hover:underline">{business.business_name}</Link></h3>
                {business.business_type ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{business.business_type}</p> : null}
                {business.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-8 text-sm text-[var(--color-text-muted)]">
        Want to discover more? <Link href="/businesses" className="font-semibold text-[var(--color-primary)] hover:underline">Browse all businesses on Twimzi</Link>.
      </p>

      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionPageSchema} />
    </main>
  );
}
