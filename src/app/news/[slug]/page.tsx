import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, Newspaper, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/config/site";
import { NewsActions } from "@/components/news/news-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  source_name: string;
  source_url: string;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
  editorial_updated_at: string | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  key_takeaways: ({ text?: string } | string)[] | null;
  business_impact: string | null;
  action_points: { title?: string; detail?: string }[] | null;
  key_figures: { label?: string; value?: string; context?: string }[] | null;
  faq: { question?: string; answer?: string }[] | null;
  related_links: { title?: string; url?: string; publisher?: string }[] | null;
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

async function getNews(slug: string): Promise<NewsItem | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("business_news")
    .select("id,title,slug,category,summary,content,source_name,source_url,featured_image_url,meta_title,meta_description,published_at,editorial_updated_at,primary_keyword,secondary_keywords,key_takeaways,business_impact,action_points,key_figures,faq,related_links")
    .eq("slug", slug)
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) console.error("News article could not be loaded:", error.message);
  return data as NewsItem | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNews(slug);
  if (!item) return { title: "News update not found | Twimzi" };
  const title = item.meta_title?.trim() || item.title;
  const description = item.meta_description?.trim() || item.summary;
  return {
    title: `${title.replace(/(?:\s*\|\s*Twimzi)+$/i, "")} | Twimzi Business News`,
    description,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: {
      type: "article",
      url: `/news/${item.slug}`,
      title,
      description,
      publishedTime: item.published_at,
      siteName: siteConfig.name,
      images: item.featured_image_url ? [item.featured_image_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: item.featured_image_url ? [item.featured_image_url] : [],
    },
  };
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__)/g);
  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={index} className="font-bold text-[#263d70]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index} className="font-medium text-[#7000D6]">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(content: string) {
  return content.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((block, index) => {
    const value = block.trim();
    if (!value) return null;
    if (value.startsWith("### ")) {
      return (
        <h3 key={index} className="mt-8 flex items-start gap-3 text-xl font-bold leading-snug text-[#263d70]">
          <span className="mt-1.5 h-5 w-1 shrink-0 rounded-full bg-[#05CDFC]" />
          {renderInline(value.slice(4))}
        </h3>
      );
    }
    if (value.startsWith("## ")) {
      return (
        <h2 key={index} className="mt-11 border-l-4 border-[#8E07FB] bg-gradient-to-r from-[#F3E8FF] via-[#EEF4FF] to-transparent py-3 pl-4 text-2xl font-extrabold leading-tight text-[#263d70] sm:text-[1.7rem]">
          {renderInline(value.slice(3))}
        </h2>
      );
    }
    if (value.startsWith("> ")) {
      return (
        <blockquote key={index} className="my-7 rounded-r-2xl border-l-4 border-[#1879FD] bg-[#E8F2FF] px-5 py-4 text-base font-medium leading-8 text-[#263d70]">
          {renderInline(value.replace(/^>\s?/gm, "").replace(/\n/g, " "))}
        </blockquote>
      );
    }
    if (/^[-*]\s+/.test(value)) {
      return (
        <ul key={index} className="my-6 space-y-3 pl-1">
          {value.split("\n").map((line, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3 text-base leading-8 text-slate-700">
              <span className="mt-[13px] h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-[#8E07FB] to-[#1879FD]" />
              <span>{renderInline(line.replace(/^[-*]\s+/, ""))}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (/^\d+\.\s+/.test(value)) {
      return (
        <ol key={index} className="my-6 space-y-3 pl-1">
          {value.split("\n").map((line, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3 text-base leading-8 text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-xs font-extrabold text-[#7000D6]">{itemIndex + 1}</span>
              <span>{renderInline(line.replace(/^\d+\.\s+/, ""))}</span>
            </li>
          ))}
        </ol>
      );
    }
    return <p key={index} className="my-5 text-[1.02rem] leading-[2] text-slate-700">{renderInline(value.replace(/\n/g, " "))}</p>;
  });
}

export default async function BusinessNewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNews(slug);
  if (!item) notFound();
  const url = `${siteConfig.url}/news/${item.slug}`;
  const wordCount = item.content.trim().split(/\s+/).length;
  const faqStructuredData = item.faq?.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: item.faq.map((entry) => ({ "@type": "Question", name: entry.question, acceptedAnswer: { "@type": "Answer", text: entry.answer } })) } : null;
  const breadcrumbStructuredData = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Business News", item: `${siteConfig.url}/news` }, { "@type": "ListItem", position: 3, name: item.title, item: url }] };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    wordCount,
    keywords: [item.primary_keyword, ...(item.secondary_keywords ?? [])].filter(Boolean),
    articleSection: item.category,
    description: item.meta_description?.trim() || item.summary,
    datePublished: item.published_at,
    dateModified: item.editorial_updated_at ?? item.published_at,
    mainEntityOfPage: url,
    image: item.featured_image_url ? [item.featured_image_url] : undefined,
    author: { "@type": "Organization", name: "Twimzi Business Desk", url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    isBasedOn: item.source_url,
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_420px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c") }} />
      {faqStructuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c") }} />}
      <div className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#7000D6]">
            <ArrowLeft className="h-4 w-4" /> All business news
          </Link>
        </div>
      </div>
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="relative overflow-hidden rounded-[28px] border border-[#E5EAF5] bg-white p-6 shadow-[0_12px_40px_rgba(38,55,100,0.06)] sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F3E8FF] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-[#E8FAFF] blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E5D5FF] bg-[#F7F0FF] px-3 py-1.5 text-xs font-bold text-[#7000D6]">
              <Sparkles className="h-3.5 w-3.5" /> {item.category}
            </span>
            <h1 className="mt-5 bg-gradient-to-r from-[#263d70] via-[#1455C7] to-[#7000D6] bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl">
              {item.title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1879FD]" />{new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(item.published_at))}</span>
              <span>By Twimzi Business Desk</span>\n              <span>{wordCount.toLocaleString("en-IN")} words</span>\n              <span className="w-full"><NewsActions item={{slug:item.slug,title:item.title,summary:item.summary,category:item.category,publishedAt:item.published_at,url:`/news/${item.slug}`}} /></span>
            </div>
            <p className="news-summary mt-7 rounded-2xl border-l-4 border-[#05CDFC] bg-[#F0FBFF] px-5 py-4 text-lg leading-8 text-[#344365]">
              {item.summary}
            </p>
          </div>
        </header>
        {item.featured_image_url && <img src={item.featured_image_url} alt={item.title} className="mt-8 max-h-[480px] w-full rounded-2xl object-cover shadow-sm" />}
        {(item.key_takeaways?.length || item.key_figures?.length) ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            {item.key_takeaways && item.key_takeaways.length > 0 && <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-[#F7F0FF] to-white p-6 sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#7000D6]">The essentials</p><h2 className="mt-2 text-xl font-extrabold text-[#263d70]">Key takeaways</h2><ul className="mt-5 space-y-3">{item.key_takeaways.map((entry,index)=><li key={index} className="flex gap-3 text-sm leading-7 text-slate-700"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-[#8E07FB] to-[#1879FD]"/><span>{typeof entry==="string"?entry:entry.text}</span></li>)}</ul></div>}
            {item.key_figures && item.key_figures.length > 0 && <div className="rounded-[24px] border border-cyan-100 bg-gradient-to-br from-[#EAFBFF] to-white p-6 sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-800">Numbers that matter</p><h2 className="mt-2 text-xl font-extrabold text-[#263d70]">Key figures</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{item.key_figures.map((figure,index)=><div key={index} className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{figure.label}</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-[#1455C7]">{figure.value}</p>{figure.context&&<p className="mt-2 text-xs leading-5 text-slate-500">{figure.context}</p>}</div>)}</div></div>}
          </section>
        ) : null}
        <section className="mt-8 overflow-hidden rounded-[26px] border border-[#E5EAF5] bg-white shadow-[0_8px_30px_rgba(38,55,100,0.045)]">
          <div className="flex items-center gap-3 border-b border-[#E9EDF7] bg-gradient-to-r from-[#F7F0FF] via-[#F2F7FF] to-[#EEFBFF] px-6 py-5 sm:px-9">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1879FD] shadow-sm"><Newspaper className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7000D6]">Twimzi Business Desk</p>
              <p className="mt-1 text-sm font-semibold text-[#344365]">The story, explained</p>
            </div>
          </div>
          <div className="px-6 py-5 sm:px-9 sm:py-8">{renderMarkdown(item.content)}</div>
        </section>
        {item.business_impact && <section className="mt-8 rounded-[24px] border border-[#DCEBFF] bg-gradient-to-br from-[#F0F7FF] to-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#1879FD]">What it means for business</p><h2 className="mt-2 text-2xl font-extrabold text-[#263d70]">Business impact</h2><p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-slate-700">{item.business_impact}</p></section>}
        {item.action_points && item.action_points.length > 0 && <section className="mt-7 rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-700">Practical next steps</p><h2 className="mt-2 text-2xl font-extrabold text-[#263d70]">What businesses can do now</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{item.action_points.map((point,index)=><div key={index} className="rounded-2xl border border-emerald-100 bg-white p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">{index+1}</span><h3 className="font-bold text-[#263d70]">{point.title}</h3></div><p className="mt-2 text-sm leading-6 text-slate-600">{point.detail}</p></div>)}</div></section>}
        {item.faq && item.faq.length > 0 && <section className="mt-8 rounded-[24px] border border-violet-100 bg-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#7000D6]">Straight answers</p><h2 className="mt-2 text-2xl font-extrabold text-[#263d70]">Frequently asked questions</h2><div className="mt-5 divide-y divide-slate-100">{item.faq.map((entry,index)=><div key={index} className="py-5 first:pt-0 last:pb-0"><h3 className="font-bold text-[#263d70]">{entry.question}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{entry.answer}</p></div>)}</div></section>}
        {item.related_links && item.related_links.length > 0 && <section className="mt-7 rounded-[24px] border border-slate-200 bg-white p-6"><h2 className="text-lg font-extrabold text-[#263d70]">Related official resources</h2><ul className="mt-3 space-y-2">{item.related_links.map((link,index)=><li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1455C7] hover:underline">{link.title} <ExternalLink className="h-3.5 w-3.5"/></a>{link.publisher&&<span className="ml-2 text-xs text-slate-500">{link.publisher}</span>}</li>)}</ul></section>}
        <section className="mt-7 overflow-hidden rounded-[24px] border border-[#DCEBFF] bg-gradient-to-br from-[#F1E9FF] via-[#EEF5FF] to-[#EAFBFF] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7000D6]">Original source</p>
          <h2 className="mt-2 text-xl font-bold text-[#263d70]">{item.source_name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Read the original announcement for the full context, official wording and any applicable conditions.</p>
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7000D6] via-[#1879FD] to-[#087FAE] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105">
            Read original announcement <ExternalLink className="h-4 w-4" />
          </a>
        </section>
        <p className="mt-7 text-xs leading-6 text-slate-500">Editorial note: This is an independent summary prepared by Twimzi from the linked source. It is not legal, tax, investment or export-compliance advice. Confirm current requirements with the relevant authority before acting.</p>
        <Link href="/news" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#1879FD] hover:text-[#7000D6] hover:underline">
          Back to business news <ArrowUpRight className="h-4 w-4" />
        </Link>
      </article>
    </main>
  );
}
