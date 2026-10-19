import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

type Category = {
  id: string;
  category_name: string;
  slug: string | null;
  description: string | null;
  parent_id: string | null;
  sort_order: number | null;
};

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  description: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
};

type PageProps = { params: Promise<{ slug: string }> };

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function slugifyCategory(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_categories");

  if (error || !data) return null;

  return (data as Category[]).find((category) => {
    const categorySlug = normalizeSlug(
      slugifyCategory(category.slug?.trim() || category.category_name),
    );
    return categorySlug === normalizeSlug(slug);
  }) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) return { title: "Category Not Found | Twimzi", robots: { index: false, follow: true } };

  const canonical = `${siteConfig.url}/businesses/category/${encodeURIComponent(slugifyCategory(category.slug?.trim() || category.category_name))}`;
  const description = category.description?.trim() ||
    `Discover ${category.category_name.toLowerCase()} businesses, shops, professionals and service providers on Twimzi.`;

  return {
    title: `${category.category_name} Businesses | Twimzi`,
    description,
    alternates: { canonical },
    openGraph: { title: `${category.category_name} Businesses | Twimzi`, description, url: canonical, type: "website" },
  };
}

export default async function BusinessCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_businesses_by_category", {
    p_category_id: category.id,
    p_search: null,
    p_limit: 60,
    p_offset: 0,
  });

  const businesses = (data ?? []) as Business[];
  const categorySlug = normalizeSlug(
    slugifyCategory(category.slug?.trim() || category.category_name),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/" className="hover:underline">Home</Link>
        {" / "}
        <Link href="/businesses" className="hover:underline">Businesses</Link>
        {" / "}
        <span aria-current="page">{category.category_name}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">Explore by category</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
          {category.category_name} Businesses
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
          {category.description?.trim() ||
            `Explore ${category.category_name.toLowerCase()} businesses and discover public business profiles on Twimzi.`}
        </p>
        <Link href="/businesses" className="mt-5 inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-secondary)]">
          Browse all businesses
        </Link>
      </header>

      {error ? (
        <p role="status" className="rounded-xl border border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">
          Businesses could not be loaded right now. Please try again shortly.
        </p>
      ) : businesses.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
          <h2 className="text-xl font-bold">No public listings yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Check back as more businesses join Twimzi.</p>
          <Link href="/add-business" className="mt-4 inline-flex font-semibold text-[var(--color-primary)] hover:underline">List your business</Link>
        </section>
      ) : (
        <section aria-labelledby="category-listings-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="category-listings-heading" className="text-2xl font-bold">Explore listings</h2>
            <span className="text-sm text-[var(--color-text-muted)]">{businesses.length} shown</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => {
              const href = `/businesses/${encodeURIComponent(business.slug?.trim() || business.id)}`;
              const location = [business.city, business.state].filter(Boolean).join(", ");
              return (
                <article key={business.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:shadow-md">
                  <h3 className="text-lg font-bold"><Link href={href} className="hover:text-[var(--color-primary)] hover:underline">{business.business_name}</Link></h3>
                  {business.business_type ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{business.business_type}</p> : null}
                  {location ? <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{location}</p> : null}
                  {business.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{business.description}</p> : null}
                </article>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-[var(--color-text-muted)]">
            Looking for more options? <Link href={`/businesses?category=${encodeURIComponent(category.id)}`} className="font-semibold text-[var(--color-primary)] hover:underline">View this category in the full directory</Link>.
          </p>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.category_name} Businesses on Twimzi`,
        url: `${siteConfig.url}/businesses/category/${encodeURIComponent(categorySlug)}`,
        isPartOf: { "@type": "WebSite", name: "Twimzi", url: siteConfig.url },
      }).replace(/</g, "\\u003c") }} />
    </main>
  );
}
