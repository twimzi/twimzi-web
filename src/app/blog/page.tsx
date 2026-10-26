import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import BlogImage from "@/components/blog/blog-image";

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

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85";

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

  const featured = posts[0];
  const remaining = posts.slice(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-[#f0f2f2]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-700"><span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" /> The Twimzi Journal</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Ideas that help businesses <span className="text-[#2459a9]">move forward.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Practical business guides, digital growth tips and useful insights for India’s entrepreneurs, professionals and local communities.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/add-business" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#2459a9] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1d477f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/60">
                List your business <span aria-hidden="true">→</span>
              </Link>
              <a href="#latest-articles" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent px-5 py-3 text-sm font-bold text-slate-800 transition-colors hover:border-slate-500 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/60">
                Explore articles <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-300 sm:gap-x-6"><span>Business essentials</span><span className="text-[#2459a9]" aria-hidden="true">•</span><span>Digital growth</span><span className="text-[#2459a9]" aria-hidden="true">•</span><span>Local discovery</span></div>
          </div>
        </div>
      </section>

      <section id="latest-articles" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Fresh perspectives</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Latest articles</h2><p className="mt-2 text-sm leading-6 text-slate-600">Actionable information, thoughtfully explained.</p></div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">{posts.length} {posts.length === 1 ? "article" : "articles"}</span>
        </div>

        {featured ? (
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-[#fbfbf8] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
            <Link href={`/blog/${featured.slug}`} aria-label={`Read ${featured.title}`} className="group relative block min-h-64 overflow-hidden bg-slate-200 sm:min-h-80 lg:min-h-[420px]">
              <BlogImage src={featured.featured_image_url || DEFAULT_COVER} alt={featured.title} className="absolute inset-0 h-full w-full object-cover " loading="eager" fetchPriority="high" />
              <span className="absolute left-5 top-5 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-800">Featured guide</span>
              <span className="absolute bottom-5 left-5 rounded-md bg-slate-950/85 px-3 py-1.5 text-xs font-bold text-white">Read the guide <span aria-hidden="true">↗</span></span>
            </Link>
            <div className="flex min-w-0 flex-col items-start justify-center p-6 sm:p-9 lg:p-10 xl:p-12">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-blue-800"><span className="rounded-full bg-blue-50 px-3 py-1.5">Business insights</span><span className="text-slate-500">{formatDate(featured.published_at ?? featured.created_at)}</span></div>
              <h3 className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl"><Link href={`/blog/${featured.slug}`} className="transition hover:text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{featured.title}</Link></h3>
              <p className="mt-4 text-base leading-7 text-slate-700">{featured.excerpt}</p>
              <Link href={`/blog/${featured.slug}`} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">Read featured article <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">✦</span>
            <p className="mt-5 text-xl font-extrabold text-slate-950">Our first guides are on the way</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">We’re preparing useful articles for business owners and local communities. Please check back soon.</p>
          </div>
        )}

        {remaining.length > 0 && <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{remaining.map((post) => <article key={post.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"><Link href={`/blog/${post.slug}`} className="block h-full"><div className="relative aspect-[16/10] overflow-hidden bg-slate-100"><BlogImage src={post.featured_image_url || DEFAULT_COVER} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /></div><div className="p-6"><p className="text-xs font-bold text-blue-800">{formatDate(post.published_at ?? post.created_at)}</p><h3 className="mt-3 text-xl font-extrabold leading-snug text-slate-950 transition group-hover:text-blue-700">{post.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{post.excerpt}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">Read article <span aria-hidden="true">→</span></span></div></Link></article>)}</div>}
      </section>

      <section className="border-y border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Your next step</p><h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">Make your business easier to discover.</h2><p className="mt-2 text-sm leading-6 text-slate-700">Create your free Twimzi listing and help customers find what you offer.</p></div><Link href="/add-business" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">Get started free <span aria-hidden="true">→</span></Link></div></section>
      <footer className="bg-slate-950 py-8 text-center text-sm text-slate-400"><p>Ideas for local business growth, from <Link href="/" className="font-bold text-white hover:text-[#2459a9]">Twimzi</Link>.</p></footer>
    </div>
  );
}
