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
  city: string | null;
  state: string | null;
  website?: string | null;
};

type PageProps = { params: Promise<{ city: string; category: string }> };

function slugPart(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function categorySlug(value: string) {
  const slug = slugPart(value);
  return slug.endsWith("s") ? slug.slice(0, -1) : slug;
}

function titleCase(value: string) {
  return value.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

async function getCityCategoryBusinesses(citySlug: string, category: string) {
  if (categorySlug(category) === "other") {
    return { businesses: [] as Business[], city: "", state: "" };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_businesses_with_location", {
    p_search: null,
    p_location: citySlug.replace(/-/g, " "),
    p_limit: 100,
    p_offset: 0,
  });

  if (error) {
    console.error("Unable to load city/category business listings:", error);
    return { businesses: [] as Business[], city: "", state: "" };
  }

  const all = (data ?? []) as Business[];
  const businesses = all.filter((business) => categorySlug(business.business_type || "") === categorySlug(category));
  const matchedCity = businesses.find((business) => slugPart(business.city || "") === slugPart(citySlug))?.city
    || all.find((business) => slugPart(business.city || "") === slugPart(citySlug))?.city
    || titleCase(citySlug);
  const matchedState = businesses[0]?.state || all.find((business) => slugPart(business.city || "") === slugPart(citySlug))?.state || "";

  return { businesses, city: matchedCity, state: matchedState };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, category } = await params;
  const { businesses, city, state } = await getCityCategoryBusinesses(citySlug, category);
  if (businesses.length < 2 || !city) {
    return { title: "Business listings not found | Twimzi", robots: { index: false, follow: true } };
  }

  const categoryName = titleCase(category);
  const location = [city, state].filter(Boolean).join(", ");
  const title = `${categoryName} in ${city} – Business Directory | Twimzi`;
  const description = `Discover ${businesses.length} public ${categoryName.toLowerCase()} businesses in ${location}. Explore business profiles and connect with providers on Twimzi.`;
  const canonical = `${siteConfig.url}/city/${encodeURIComponent(slugPart(citySlug))}/${encodeURIComponent(slugPart(category))}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description },
  };
}

export default async function CityCategoryPage({ params }: PageProps) {
  const { city: citySlug, category } = await params;
  const { businesses, city, state } = await getCityCategoryBusinesses(citySlug, category);
  if (businesses.length < 2 || !city) notFound();

  const categoryName = titleCase(category);
  const location = [city, state].filter(Boolean).join(", ");
  const canonical = `${siteConfig.url}/city/${encodeURIComponent(slugPart(citySlug))}/${encodeURIComponent(slugPart(category))}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Businesses", item: `${siteConfig.url}/businesses` },
      { "@type": "ListItem", position: 3, name: location, item: `${siteConfig.url}/businesses/location/${slugPart(citySlug)}-${slugPart(state)}` },
      { "@type": "ListItem", position: 4, name: `${categoryName} in ${city}`, item: canonical },
    ],
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} in ${city} on Twimzi`,
    description: `Public ${categoryName.toLowerCase()} business listings in ${location}.`,
    url: canonical,
    numberOfItems: businesses.length,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:underline">Home</Link>{" / "}
        <Link href="/businesses" className="hover:underline">Businesses</Link>{" / "}
        <span>{location}</span>{" / "}
        <span aria-current="page">{categoryName}</span>
      </nav>
      <header className="mb-10 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">Business directory by city and category</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          {categoryName} in {city}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
          Explore {businesses.length} public {categoryName.toLowerCase()} business listings in {location}. Review business profiles and discover companies offering products and services in this area.
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{businesses.length} public listings</p>
      </header>
      <section aria-labelledby="city-category-listings">
        <h2 id="city-category-listings" className="mb-5 text-2xl font-bold">{categoryName} businesses in {city}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <article key={business.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-md">
              <h3 className="text-lg font-bold">
                <Link href={`/businesses/${encodeURIComponent(business.slug?.trim() || business.id)}`} className="hover:text-[var(--color-primary)] hover:underline">
                  {business.business_name}
                </Link>
              </h3>
              {business.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p> : null}
              {business.website ? <a href={business.website} rel="nofollow noopener noreferrer" target="_blank" className="mt-3 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline">Business website</a> : null}
            </article>
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-2xl bg-[var(--color-secondary)] p-6 sm:p-8">
        <h2 className="text-xl font-bold">List your {categoryName.toLowerCase()} business in {city}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Create a free Twimzi business profile to help customers discover your business, products and services.</p>
        <Link href="/add-business" className="mt-4 inline-flex rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90">List your business free</Link>
      </section>
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionSchema} />
    </main>
  );
}
