import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock3, Newspaper, Search } from "lucide-react";
import { businessNews, businessNewsCategories, formatNewsDate } from "@/lib/business-news";

export const metadata: Metadata = {
  title: "Business News & Updates India | Trade, MSME & Industry | Twimzi",
  description: "Verified business news and official updates for Indian businesses: exports, manufacturing, trade policy and government announcements. Read source-linked summaries on Twimzi.",
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    url: "/news",
    title: "Business News & Updates | Twimzi",
    description: "Important business developments, explained with original source links."
  }
};

export default async function BusinessNewsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const category = businessNewsCategories.includes((params.category ?? "All") as typeof businessNewsCategories[number]) ? params.category ?? "All" : "All";
  const query = (params.q ?? "").trim().toLowerCase();
  const filtered = businessNews.filter((item) => {
    const categoryMatch = category === "All" || item.category === category;
    const textMatch = !query || [item.title, item.summary, item.category].join(" ").toLowerCase().includes(query);
    return categoryMatch && textMatch;
  });
  const featured = filtered[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-800"><Newspaper className="h-4 w-4"/> Twimzi Business Desk</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Business news that <span className="text-blue-700">moves you forward.</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Important developments in trade, exports, manufacturing and business policy—summarised with links to the original source.</p>
          </div>
          <form action="/news" className="mt-8 flex max-w-xl gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            {category !== "All" && <input type="hidden" name="category" value={category}/>}
            <label className="flex min-w-0 flex-1 items-center gap-2 px-3"><Search className="h-4 w-4 shrink-0 text-slate-400"/><input name="q" defaultValue={params.q ?? ""} placeholder="Search business news..." className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label="Search business news"/></label>
            <button className="rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-blue-800">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <nav aria-label="News categories" className="flex flex-wrap gap-2">
          {businessNewsCategories.map((item) => <Link key={item} href={item === "All" ? "/news" : `/news?category=${encodeURIComponent(item)}`} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category === item ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}>{item}</Link>)}
        </nav>

        <div className="mb-6 mt-9 flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Source-linked reporting</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Latest business updates</h2></div>
          <span className="text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? "update" : "updates"}</span>
        </div>

        {featured ? (
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1.1fr_.9fr]">
            <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-900 p-8 text-white sm:min-h-80 lg:min-h-[350px]">
              <div className="max-w-md"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">{featured.category}</span><Newspaper className="mt-8 h-12 w-12 text-cyan-300"/><p className="mt-5 text-sm text-blue-100">Twimzi Business Desk</p><p className="mt-1 text-2xl font-extrabold">News with business context.</p></div>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-9">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500"><span>{formatNewsDate(featured.publishedAt)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5"/>{featured.readingTime} min read</span></div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl"><Link href={`/news/${featured.slug}`} className="hover:text-blue-700">{featured.title}</Link></h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{featured.summary}</p>
              <Link href={`/news/${featured.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">Read the update <ArrowUpRight className="h-4 w-4"/></Link>
            </div>
          </article>
        ) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No news matches this search. Try another keyword or category.</div>}

        {filtered.length > 1 && <div className="mt-7 grid gap-5 md:grid-cols-2">
          {filtered.slice(1).map((item) => <article key={item.slug} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{item.category}</span><span>{formatNewsDate(item.publishedAt)}</span></div>
            <h3 className="mt-4 text-xl font-extrabold leading-snug text-slate-950"><Link href={`/news/${item.slug}`} className="hover:text-blue-700">{item.title}</Link></h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            <Link href={`/news/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">Read update <ArrowUpRight className="h-4 w-4"/></Link>
          </article>)}
        </div>}
        <p className="mt-9 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-500">Twimzi summaries are for general information. Each update links to its original publisher. Policy, scheme and eligibility details can change; always check the official source before taking action.</p>
      </section>
    </main>
  );
}
