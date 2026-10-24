import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Small Business Tips, Local Guides & Insights",
  description: "Practical guides to help Indian businesses grow online and help people discover trusted local businesses with Twimzi.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Twimzi Blog — Small Business Tips & Local Guides",
    description: "Practical guides for local businesses, shoppers and service seekers.",
  },
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
};

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function BlogPage() {
  const supabase = getPublicClient();
  let posts: BlogPost[] = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,featured_image_url,published_at,created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(24);
    if (error) console.error("Blog listing could not be loaded:", error.message);
    else posts = (data ?? []) as BlogPost[];
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <section className="bg-gradient-to-br from-[var(--color-primary-light)] via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">The Twimzi Blog</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">Ideas to help local businesses grow</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">Practical business tips, online visibility guides and local discoveries for India’s entrepreneurs, professionals and communities.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/add-business" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]">List your business</Link>
            <Link href="/businesses" className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)]">Explore businesses</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">Latest articles</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Useful, actionable ideas for growing and finding businesses.</p>
          </div>
          <span className="hidden rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] sm:inline-flex">Guides · Tips · Local stories</span>
        </div>

        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-md">
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.featured_image_url ? (
                    <div className="relative aspect-[16/9] bg-[var(--color-surface)]">
                      <Image src={post.featured_image_url} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-surface)]">
                      <span className="text-4xl font-extrabold text-[var(--color-primary)]">T.</span>
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-xs font-semibold text-[var(--color-primary)]">{formatDate(post.published_at)}</p>
                    <h3 className="mt-3 text-xl font-bold leading-snug text-[var(--color-text)] hover:text-[var(--color-primary)]">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">{post.excerpt}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">Read article <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
            <p className="text-lg font-bold text-[var(--color-text)]">The first articles are coming soon</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">We’re preparing practical guides for business owners and local communities. Check back soon for new articles.</p>
          </div>
        )}
      </section>
    </div>
  );
}
