import type { Metadata, MetadataRoute } from "next";
import Link from "next/link";
import xmlSitemap from "../sitemap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seoDirectoryPages } from "@/lib/seo/programmatic-directory";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "HTML Sitemap | Explore Twimzi",
  description:
    "Explore all public pages on Twimzi, including business listings, categories, products, services and articles.",
  alternates: { canonical: "https://www.twimzi.com/sitemap" },
};

type SitemapLink = { label: string; href: string };
type PublicBusinessLabel = { id: string; slug: string | null; business_name?: string | null; name?: string | null };

function labelFromUrl(url: string): string {
  const pathname = new URL(url).pathname;
  const lastPart = pathname.split("/").filter(Boolean).at(-1);
  if (!lastPart) return "Home";
  return decodeURIComponent(lastPart)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function SitemapSection({
  title,
  links,
}: {
  title: string;
  links: SitemapLink[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
      <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[var(--color-primary)] underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HtmlSitemapPage() {
  // Use the exact same live URL inventory as /sitemap.xml.
  // New static routes and eligible public dynamic URLs appear here automatically.
  const entries = (await xmlSitemap()) as MetadataRoute.Sitemap;

  // Resolve public business profile identifiers to their display names.
  const supabase = await createSupabaseServerClient();
  const businessLabels = new Map<string, string>();
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.rpc("get_public_businesses", {
      p_search: null,
      p_limit: pageSize,
      p_offset: offset,
    });
    if (error || !data) break;

    for (const business of data as PublicBusinessLabel[]) {
      const identifier = business.slug?.trim() || business.id;
      const displayName = business.business_name?.trim() || business.name?.trim();
      if (identifier && displayName) {
        businessLabels.set(
          `/businesses/${encodeURIComponent(identifier)}`,
          displayName,
        );
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const links = entries
    .filter((entry) => {
      const path = new URL(entry.url).pathname;
      // Do not expose routes explicitly excluded from crawling or authentication.
      return path !== "/add-business" && !/^\/(login|admin|dashboard)(\/|$)/.test(path);
    })
    .map((entry) => ({
      label:
        businessLabels.get(new URL(entry.url).pathname) || labelFromUrl(entry.url),
      href: new URL(entry.url).pathname,
    }));

  const uniqueLinks = Array.from(
    new Map(links.map((link) => [link.href, link])).values(),
  );

  const seoLandingSlugs = new Set([
    ...seoDirectoryPages.map((page) => `/${page.slug}`),
    "/free-business-listing-india",
  ]);

  const groups: Array<{ title: string; matches: (href: string) => boolean }> = [
    { title: "Main Pages", matches: (href) => !/^\/(businesses|products|services|offers|blog|city)\//.test(href) && !seoLandingSlugs.has(href) },
    { title: "Business Categories & Locations", matches: (href) => href.startsWith("/businesses/category/") || href.startsWith("/businesses/location/") || href.startsWith("/city/") },
    { title: "SEO Landing Pages", matches: (href) => seoLandingSlugs.has(href) },
    { title: "Business Profiles", matches: (href) => /^\/businesses\/[^/]+$/.test(href) },
    { title: "Products", matches: (href) => href.startsWith("/products/") },
    { title: "Services", matches: (href) => href.startsWith("/services/") },
    { title: "Articles & Guides", matches: (href) => href.startsWith("/blog/") },
  ];

  const assigned = new Set<string>();
  const sections = groups.map((group) => {
    const sectionLinks = uniqueLinks.filter((link) => {
      if (assigned.has(link.href) || !group.matches(link.href)) return false;
      assigned.add(link.href);
      return true;
    });
    return { title: group.title, links: sectionLinks };
  });
  const otherLinks = uniqueLinks.filter((link) => !assigned.has(link.href));

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Navigate Twimzi
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl">
            HTML Sitemap
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
            Browse Twimzi’s public pages in one place. This directory is generated
            from the same live page inventory as our XML sitemap and refreshes hourly.
          </p>
        </header>

        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <SitemapSection key={section.title} {...section} />
          ))}
          <SitemapSection title="Other Public Pages" links={otherLinks} />
        </div>

        <p className="mt-8 text-sm text-[var(--color-text-muted)]">
          Search engines can also use our{" "}
          <a
            href="/sitemap.xml"
            className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            XML sitemap
          </a>.
        </p>
      </div>
    </main>
  );
}
