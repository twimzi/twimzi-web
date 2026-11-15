import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "HTML Sitemap | Explore Twimzi",
  description:
    "Explore Twimzi's pages, business categories, local businesses and latest articles in one place.",
  alternates: { canonical: "https://www.twimzi.com/sitemap" },
};

type Category = {
  id: string;
  category_name: string;
};

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
};

type BlogPost = {
  title: string;
  slug: string;
};

const coreLinks = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
  { label: "About Twimzi", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Add Your Business", href: "/add-business" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Community Guidelines", href: "/community-guidelines" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

function SitemapSection({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
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
  const supabase = await createSupabaseServerClient();

  const [
    { data: categoryData },
    { data: businessData },
    { data: blogData },
  ] = await Promise.all([
    supabase.rpc("get_public_categories"),
    supabase.rpc("get_public_businesses", {
      p_search: null,
      p_limit: 18,
      p_offset: 0,
    }),
    supabase
      .from("blog_posts")
      .select("title,slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const categories = ((categoryData ?? []) as Category[])
    .filter((category) => category.id && category.category_name)
    .slice(0, 24)
    .map((category) => ({
      label: category.category_name,
      href: `/businesses?category=${encodeURIComponent(category.id)}`,
    }));

  const businesses = ((businessData ?? []) as Business[])
    .filter((business) => business.id && business.business_name)
    .map((business) => ({
      label: business.business_name,
      href: `/businesses/${encodeURIComponent(business.slug?.trim() || business.id)}`,
    }));

  const articles = ((blogData ?? []) as BlogPost[])
    .filter((post) => post.slug && post.title)
    .map((post) => ({
      label: post.title,
      href: `/blog/${encodeURIComponent(post.slug)}`,
    }));

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
            Find your way around Twimzi. Browse important pages, business
            categories, local business profiles and the latest articles.
          </p>
        </header>

        <div className="mt-10 grid gap-5">
          <SitemapSection title="Explore Twimzi" links={coreLinks} />
          <SitemapSection title="Business Categories" links={categories} />
          <SitemapSection title="Recently Listed Businesses" links={businesses} />
          <SitemapSection title="Latest Articles" links={articles} />
          <SitemapSection title="Policies & Information" links={legalLinks} />
        </div>

        <p className="mt-8 text-sm text-[var(--color-text-muted)]">
          Looking for the technical XML sitemap?{" "}
          <a
            href="/sitemap.xml"
            className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            View XML sitemap
          </a>
        </p>
      </div>
    </main>
  );
}
