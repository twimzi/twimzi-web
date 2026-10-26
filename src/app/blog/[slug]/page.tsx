import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";
import BlogEngagement from "@/components/blog/blog-engagement";
import BlogImage from "@/components/blog/blog-image";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85";

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,content,featured_image_url,meta_title,meta_description,published_at,created_at,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("Blog article could not be loaded:", error.message);
  return (data as BlogPost | null) ?? null;
}

async function getRelatedPosts(slug: string): Promise<Pick<BlogPost, "id" | "title" | "slug" | "excerpt" | "featured_image_url" | "published_at" | "created_at">[]> {
  const supabase = getPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,featured_image_url,published_at,created_at")
    .eq("status", "published")
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) {
    console.error("Related blog articles could not be loaded:", error.message);
    return [];
  }
  return data ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  const title = post.meta_title?.trim() || post.title;
  const description = post.meta_description?.trim() || post.excerpt;
  const image = post.featured_image_url || DEFAULT_COVER;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title,
      description,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220));
}

function renderParagraph(text: string, key: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return (
    <p key={key} className="mt-4 text-[16px] leading-8 text-slate-700 sm:text-[17px]">
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (/^https?:\/\//.test(part)) {
          const cleanUrl = part.replace(/[.,;!?]+$/, "");
          const trailing = part.slice(cleanUrl.length);
          return <span key={index}><a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">{cleanUrl}</a>{trailing}</span>;
        }
        return part;
      })}
    </p>
  );
}

function renderContent(content: string) {
  const blocks = content.split(/\r?\n\s*\r?\n/);
  return blocks.map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("### ")) {
      return <h3 id={`section-${index}`} key={index} className="scroll-mt-24 mt-9 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 id={`section-${index}`} key={index} className="scroll-mt-24 mt-12 border-b border-slate-200 pb-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{trimmed.slice(3)}</h2>;
    }
    if (/^[-*] /.test(trimmed)) {
      const items = trimmed.split(/\r?\n/).filter((line) => /^[-*] /.test(line.trim()));
      return <ul key={index} className="mt-5 space-y-3 pl-1">{items.map((item, itemIndex) => <li key={itemIndex} className="flex gap-3 text-[16px] leading-7 text-slate-700 sm:text-[17px]"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" /><span>{renderInline(item.trim().slice(2), `${index}-${itemIndex}`)}</span></li>)}</ul>;
    }
    if (/^\d+[.)] /.test(trimmed)) {
      const items = trimmed.split(/\r?\n/).filter((line) => /^\d+[.)] /.test(line.trim()));
      return <ol key={index} className="mt-5 space-y-3 pl-1">{items.map((item, itemIndex) => <li key={itemIndex} className="flex gap-3 text-[16px] leading-7 text-slate-700 sm:text-[17px]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">{itemIndex + 1}</span><span>{renderInline(item.trim().replace(/^\d+[.)] /, ""), `${index}-${itemIndex}`)}</span></li>)}</ol>;
    }
    if (trimmed.startsWith("> ")) {
      return <blockquote key={index} className="mt-7 rounded-r-xl border-l-4 border-blue-600 bg-blue-50 px-5 py-4 text-base font-medium leading-7 text-slate-800">{renderInline(trimmed.slice(2), String(index))}</blockquote>;
    }
    return renderParagraph(trimmed, String(index));
  });
}

function renderInline(text: string, key: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${key}-${index}`} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      const cleanUrl = part.replace(/[.,;!?]+$/, "");
      return <a key={`${key}-${index}`} href={cleanUrl} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">{cleanUrl}{part.slice(cleanUrl.length)}</a>;
    }
    return part;
  });
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, relatedPosts] = await Promise.all([getPost(slug), getRelatedPosts(slug)]);
  if (!post) notFound();

  const cover = post.featured_image_url || DEFAULT_COVER;
  const date = formatDate(post.published_at ?? post.created_at);
  const minutes = readingTime(post.content);
  const sections = post.content.split(/\r?\n\s*\r?\n/).map((block, index) => {
    const text = block.trim();
    if (text.startsWith("## ")) return { id: `section-${index}`, title: text.slice(3) };
    if (text.startsWith("### ")) return { id: `section-${index}`, title: text.slice(4) };
    return null;
  }).filter((section): section is { id: string; title: string } => section !== null);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description?.trim() || post.excerpt,
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    image: [cover],
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <article className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"><span aria-hidden="true">←</span> All articles</Link>
          <span className="mx-3 text-slate-300">/</span><span className="text-sm text-slate-500">Twimzi Guides</span>
        </div>
      </div>

      <header className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 -z-20">
          <BlogImage src={cover} alt="" className="h-full w-full object-cover opacity-25" loading="eager" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/70" />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5">Business guide</span>
              <span>{date}</span><span className="text-white/40">·</span><span>{minutes} min read</span>
            </div>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-xl sm:leading-9">{post.excerpt}</p>
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white p-1.5 shadow-sm"><img src={siteConfig.brand.mark} alt="Twimzi logo" className="h-full w-full object-contain" /></span>
              <span><strong className="block text-white">Twimzi Editorial Team</strong><span className="text-slate-400">Practical insights for growing businesses</span></span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:px-8">
        <main className="min-w-0">
          <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <BlogImage src={cover} alt={post.title} className="aspect-[16/9] w-full object-cover" loading="eager" fetchPriority="high" />
            <figcaption className="flex items-center justify-between gap-4 px-4 py-3 text-xs text-slate-500 sm:px-5">
              <span>Twimzi Business Guides</span><span>Updated for 2026</span>
            </figcaption>
          </figure>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
            <div className="mb-8 rounded-xl border-l-4 border-blue-600 bg-blue-50 px-5 py-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-800">In this guide</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Clear steps, key details and practical information to help you make informed business decisions.</p>
              {sections.length > 0 && <nav aria-label="Table of contents" className="mt-3"><ul className="space-y-2">{sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">{section.title}</a></li>)}</ul></nav>}
            </div>
            <div className="blog-article-content">{renderContent(post.content)}</div>
            <div className="mt-12 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
              <strong className="text-slate-700">Editorial note:</strong> Information is provided for general educational purposes. Verify current requirements with the relevant official authority before acting.
            </div>
          </div>

          <div className="mt-8"><BlogEngagement postId={post.id} postUrl={`${siteConfig.url}/blog/${post.slug}`} postTitle={post.title} /></div>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-blue-700">Grow with Twimzi</p>
            <h2 className="mt-3 text-xl font-extrabold leading-snug text-slate-950">Help more customers discover your business.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Create a business listing and make your services easier to find online.</p>
            <Link href="/add-business" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700">List your business <span className="ml-2" aria-hidden="true">→</span></Link>
            <Link href="/businesses" className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">Explore businesses</Link>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-950">About this guide</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-slate-500">Published</dt><dd className="mt-1 font-semibold text-slate-800">{date}</dd></div>
              <div><dt className="text-slate-500">Reading time</dt><dd className="mt-1 font-semibold text-slate-800">{minutes} minutes</dd></div>
              <div><dt className="text-slate-500">Prepared by</dt><dd className="mt-1 font-semibold text-slate-800">Twimzi Editorial Team</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {relatedPosts.length > 0 && <section className="border-t border-slate-200 bg-white py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Keep exploring</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">More useful reads</h2></div><Link href="/blog" className="text-sm font-bold text-blue-700 hover:underline">All articles →</Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedPosts.map((related) => <article key={related.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"><Link href={`/blog/${related.slug}`} className="block h-full"><BlogImage src={related.featured_image_url || DEFAULT_COVER} alt={related.title} className="aspect-[16/9] w-full object-cover" loading="lazy" /><div className="p-5"><p className="text-xs font-semibold text-blue-700">{formatDate(related.published_at ?? related.created_at)}</p><h3 className="mt-2 text-lg font-extrabold leading-snug text-slate-900">{related.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{related.excerpt}</p><span className="mt-4 inline-flex text-sm font-bold text-blue-700">Read article →</span></div></Link></article>)}</div></div></section>}

      <footer className="bg-slate-950 py-8 text-center text-sm text-slate-400"><p>Made for local business growth. <Link href="/" className="font-bold text-white hover:text-blue-300">Discover Twimzi</Link></p></footer>
    </article>
  );
}
