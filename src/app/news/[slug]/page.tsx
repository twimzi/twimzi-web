import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, ExternalLink, Newspaper } from "lucide-react";
import { notFound } from "next/navigation";
import { businessNews, formatNewsDate, getBusinessNews } from "@/lib/business-news";
import { siteConfig } from "@/config/site";

export const dynamicParams = false;
export function generateStaticParams() { return businessNews.map((item) => ({ slug: item.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getBusinessNews(slug);
  if (!item) return { title: "News update not found | Twimzi" };
  return {
    title: `${item.title} | Twimzi Business News`,
    description: item.summary,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: { type: "article", url: `/news/${item.slug}`, title: item.title, description: item.summary, publishedTime: item.publishedAt, siteName: siteConfig.name }
  };
}

export default async function BusinessNewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getBusinessNews(slug);
  if (!item) notFound();
  const related = businessNews.filter((entry) => entry.slug !== item.slug && entry.category === item.category).slice(0, 2);
  const url = `${siteConfig.url}/news/${item.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Twimzi Business Desk", url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    isBasedOn: item.sourceUrl
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}/>
      <div className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-4xl px-4 py-4 sm:px-6"><Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4"/> All business news</Link></div></div>
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">{item.category}</span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">{item.title}</h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4"/>{formatNewsDate(item.publishedAt)}</span><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4"/>{item.readingTime} min read</span><span>By Twimzi Business Desk</span></div>
          <p className="mt-7 text-lg leading-8 text-slate-600">{item.summary}</p>
        </header>
        <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700"><Newspaper className="h-4 w-4"/> What businesses should know</div>
          <ul className="mt-5 space-y-4">{item.keyPoints.map((point) => <li key={point} className="flex gap-3 text-base leading-7 text-slate-700"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"/><span>{point}</span></li>)}</ul>
          <div className="mt-8 border-t border-slate-100 pt-7"><h2 className="text-xl font-extrabold text-slate-950">Why this matters for businesses</h2><p className="mt-3 text-base leading-8 text-slate-700">{item.whyItMatters}</p></div>
        </div>
        <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-6 sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-800">Original source</p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">{item.source}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Read the original announcement for the full context, official wording and any applicable conditions.</p>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">Read original announcement <ExternalLink className="h-4 w-4"/></a>
        </section>
        <p className="mt-7 text-xs leading-6 text-slate-500">Editorial note: This is an independent summary prepared by Twimzi from the linked source. It is not legal, tax, investment or export-compliance advice. Confirm current requirements with the relevant authority before acting.</p>
        {related.length > 0 && <section className="mt-12 border-t border-slate-200 pt-8"><h2 className="text-xl font-extrabold text-slate-950">More in {item.category}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{related.map((entry) => <Link key={entry.slug} href={`/news/${entry.slug}`} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300"><span className="text-xs font-semibold text-slate-500">{formatNewsDate(entry.publishedAt)}</span><span className="mt-2 block font-bold leading-snug text-slate-900">{entry.title}</span><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-700">Read update <ArrowUpRight className="h-4 w-4"/></span></Link>)}</div></section>}
      </article>
    </main>
  );
}
