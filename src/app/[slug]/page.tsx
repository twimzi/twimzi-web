import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StructuredData } from "@/components/seo/structured-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import {
  getSeoDirectoryPage,
  matchesSeoDirectoryPage,
  SEO_DIRECTORY_MIN_LISTINGS,
} from "@/lib/seo/programmatic-directory";

export const revalidate = 3600;

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
};

async function getBusinesses(page: NonNullable<ReturnType<typeof getSeoDirectoryPage>>) {
  const supabase = await createSupabaseServerClient();
  const all: Business[] = [];
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.rpc("get_public_businesses_with_location", {
      p_search: null,
      p_location: null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error || !data) {
      console.error("Unable to load public businesses for SEO directory:", error);
      break;
    }

    const batch = data as Business[];
    all.push(...batch.filter((business) => matchesSeoDirectoryPage(business, page)));
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoDirectoryPage(slug);
  if (!page) return { title: "Directory page not found | Twimzi", robots: { index: false, follow: true } };

  const businesses = await getBusinesses(page);
  const canonical = `${siteConfig.url}/${page.slug}`;
  const canIndex = businesses.length >= SEO_DIRECTORY_MIN_LISTINGS;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    robots: canIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: "website", url: canonical, title: page.title, description: page.description },
  };
}

export default async function SeoDirectoryPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSeoDirectoryPage(slug);
  if (!page) notFound();

  const businesses = await getBusinesses(page);
  if (businesses.length === 0) notFound();

  const canonical = `${siteConfig.url}/${page.slug}`;
  const canIndex = businesses.length >= SEO_DIRECTORY_MIN_LISTINGS;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.heading,
    description: page.description,
    url: canonical,
    numberOfItems: businesses.length,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Business directory", item: `${siteConfig.url}/businesses` },
      { "@type": "ListItem", position: 3, name: page.heading, item: canonical },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:underline">Home</Link>{" / "}
        <Link href="/businesses" className="hover:underline">Business directory</Link>{" / "}
        <span aria-current="page">{page.heading}</span>
      </nav>

      <header className="mb-10 max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">Twimzi business directory</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">{page.heading}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">{page.intro}</p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{businesses.length} matching public business {businesses.length === 1 ? "profile" : "profiles"}</p>
      </header>

      <section aria-labelledby="directory-listings-heading">
        <h2 id="directory-listings-heading" className="mb-5 text-2xl font-bold">Explore matching businesses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <article key={business.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-md">
              <h3 className="text-lg font-bold">
                <Link href={`/businesses/${encodeURIComponent(business.slug?.trim() || business.id)}`} className="hover:text-[var(--color-primary)] hover:underline">
                  {business.business_name}
                </Link>
              </h3>
              {business.business_type ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{business.business_type}</p> : null}
              {business.city || business.state ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">{[business.city, business.state].filter(Boolean).join(", ")}</p> : null}
              {business.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-4xl">
        <h2 className="text-2xl font-bold">What to check before contacting a business</h2>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">{page.detail}</p>
        <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
          Twimzi provides business discovery and profile information. Listing details are supplied by businesses and should be independently verified before commercial decisions.
        </p>
      </section>

      <section className="mt-12 rounded-2xl bg-[var(--color-secondary)] p-6 sm:p-8">
        <h2 className="text-xl font-bold">List your business on Twimzi</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Create a business profile to help customers and potential partners discover your company, products and services.</p>
        <Link href="/add-business" className="mt-4 inline-flex rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90">Add your business</Link>
      </section>

      {!canIndex ? (
        <p className="mt-6 text-xs text-[var(--color-text-muted)]">This emerging directory page is not yet included in search engine sitemaps while its public listing coverage grows.</p>
      ) : null}

      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionSchema} />
    </main>
  );
}
