import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  const title = post.meta_title?.trim() || post.title;
  const description = post.meta_description?.trim() || post.excerpt;
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
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: post.featured_image_url ? [post.featured_image_url] : undefined },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description?.trim() || post.excerpt,
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    ...(post.featured_image_url ? { image: [post.featured_image_url] } : {}),
  };

  return (
    <article className="min-h-screen bg-[var(--color-background)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline">← All articles</Link>
        <header className="mt-8">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Twimzi Guides <span className="mx-2 text-[var(--color-text-muted)]">·</span> {formatDate(post.published_at ?? post.created_at)}</p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--color-text-secondary)]">{post.excerpt}</p>
        </header>
        {post.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featured_image_url} alt="" className="mt-8 max-h-[480px] w-full rounded-2xl object-cover" />
        ) : null}
        <div className="prose prose-lg mt-10 max-w-none text-[var(--color-text)]">
          {post.content.split(/\r?\n\s*\r?\n/).map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;
            if (trimmed.startsWith("### ")) return <h3 key={index} className="mt-8 text-2xl font-bold">{trimmed.slice(4)}</h3>;
            if (trimmed.startsWith("## ")) return <h2 key={index} className="mt-10 text-3xl font-bold">{trimmed.slice(3)}</h2>;
            return <p key={index} className="mt-5 whitespace-pre-line text-base leading-8 text-[var(--color-text-secondary)]">{trimmed}</p>;
          })}
        </div>
        <footer className="mt-14 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">Discover more with Twimzi</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Find local businesses, products and services, or create a free business listing to help more people discover your business.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/businesses" className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">Explore businesses</Link>
            <Link href="/add-business" className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">List your business</Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
