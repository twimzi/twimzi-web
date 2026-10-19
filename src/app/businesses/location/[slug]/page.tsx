import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  updated_at?: string | null;
};

type PageProps = { params: Promise<{ slug: string }> };

function slugPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getLocationSlug(business: Business) {
  const city = business.city?.trim();
  const state = business.state?.trim();
  if (!city || !state) return null;
  return `${slugPart(city)}-${slugPart(state)}`;
}

async function getPublicBusinesses(): Promise<Business[]> {
  const supabase = await createSupabaseServerClient();
  const pageSize = 100;
  const rows: Business[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.rpc("get_public_businesses", {
      p_search: null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error || !data) {
      if (error) console.error("Failed to load public businesses for location page:", error);
      break;
    }

    const page = data as Business[];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

function getLocationLabel(businesses: Business[]) {
  const first = businesses[0];
  return [first?.city?.trim(), first?.state?.trim()].filter(Boolean).join(", ");
}

async function getLocationBusinesses(slug: string) {
  const allBusinesses = await getPublicBusinesses();
  const businesses = allBusinesses.filter((business) => getLocationSlug(business) === slugPart(slug));
  return { businesses, location: getLocationLabel(businesses) };
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Businesses in ${location} on Twimzi`,
        url: `${siteConfig.url}/businesses/location/${encodeURIComponent(slugPart(slug))}`,
        isPartOf: { "@type": "WebSite", name: "Twimzi", url: siteConfig.url },
      }).replace(/</g, "\\u003c") }} />
    </main>
  );
}
