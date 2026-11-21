import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, CheckCircle2,
  Clock3, Factory, Globe2, Newspaper, Search, ShieldCheck, Sparkles, TrendingUp,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { NewsActions } from "@/components/news/news-actions";
import NewsCoverImage from "@/components/news/news-cover-image";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Business News & Insights India | Trade, MSME & Industry | Twimzi",
  description: "Business news that matters to Indian businesses. Explore trade, exports, manufacturing and policy updates with clear summaries and original sources.",
  alternates: { canonical: "/news" },
  openGraph: {
    type: "website",
    url: "/news",
    title: "Twimzi Business News & Insights",
    description: "Important business developments, explained with original source links.",
  },
};

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  source_name: string;
  source_url: string;
  featured_image_url: string | null;
  published_at: string;
  reading_time_minutes: number;
};

const categories = [
  { name: "All", icon: Newspaper, tone: "blue" },
  { name: "Trade & Exports", icon: Globe2, tone: "violet" },
  { name: "Manufacturing", icon: Factory, tone: "cyan" },
  { name: "Markets & Policy", icon: BriefcaseBusiness, tone: "orange" },
];

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function categoryTone(category: string) {
  if (category === "Trade & Exports") return {
    pill: "border-violet-200 bg-violet-50 text-violet-700",
    icon: "from-violet-600 to-indigo-600",
    wash: "from-violet-100 via-indigo-50 to-white",
    label: "Trade & Exports",
  };
  if (category === "Manufacturing") return {
    pill: "border-cyan-200 bg-cyan-50 text-cyan-800",
    icon: "from-cyan-600 to-blue-600",
    wash: "from-cyan-100 via-sky-50 to-white",
    label: "Manufacturing",
  };
  return {
    pill: "border-orange-200 bg-orange-50 text-orange-800",
    icon: "from-orange-500 to-rose-500",
    wash: "from-orange-100 via-amber-50 to-white",
    label: "Markets & Policy",
  };
}


function NewsCard({ item }: { item: NewsItem }) {
  const tone = categoryTone(item.category);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_44px_rgba(30,55,110,0.10)]">
      <Link href={`/news/${item.slug}`} aria-label={`Read ${item.title}`} className="block overflow-hidden">
        <div className="relative h-[190px] overflow-hidden">
          {item.featured_image_url ? (
            <NewsCoverImage src={item.featured_image_url} alt={item.title} category={item.category} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : <NewsCoverImage alt={item.title} category={item.category} />}
          <span className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-[11px] font-bold backdrop-blur ${tone.pill}`}>{item.category}</span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-slate-400" />{formatDate(item.published_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-400" />{item.reading_time_minutes} min read</span>
        </div>
        <h3 className="mt-4 text-[19px] font-extrabold leading-snug tracking-[-0.025em] text-[#14243D] transition group-hover:text-[#1455C7]">
          <Link href={`/news/${item.slug}`}>{item.title}</Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{item.summary}</p>
        <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-5 mt-5"><NewsActions compact item={{slug:item.slug,title:item.title,summary:item.summary,category:item.category,publishedAt:item.published_at,url:`/news/${item.slug}`}} /><div className="flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold text-slate-500"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />{item.source_name}</span>
          <Link href={`/news/${item.slug}`} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#1879FD] transition group-hover:gap-2 hover:text-[#7000D6]">Read story <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        </div>
      </div>
    </article>
  );
}

export default async function BusinessNewsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const category = categories.some((item) => item.name === params.category) ? params.category ?? "All" : "All";
  const query = (params.q ?? "").trim();
  const supabase = getClient();
  let posts: NewsItem[] = [];
  let loadError = false;

  if (supabase) {
    let request = supabase
      .from("business_news")
      .select("id,title,slug,category,summary,source_name,source_url,featured_image_url,published_at,reading_time_minutes")
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(100);
    if (category !== "All") request = request.eq("category", category);
    if (query) {
      const safeQuery = query.replace(/[,%()]/g, " ");
      request = request.or(`title.ilike.%${safeQuery}%,summary.ilike.%${safeQuery}%`);
    }
    const { data, error } = await request;
    if (error) {
      console.error("Business news could not be loaded:", error.message);
      loadError = true;
    } else posts = (data ?? []) as NewsItem[];
  }

  const featured = posts[0];
  const remaining = posts.slice(1);
  const total = posts.length;

  return (
    <main className="min-h-screen bg-[#F7F9FD] text-[#14243D]">
      <section className="relative isolate overflow-hidden bg-[#071633] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_15%,rgba(142,7,251,.34),transparent_34%),radial-gradient(ellipse_at_88%_80%,rgba(5,205,252,.23),transparent_34%),linear-gradient(115deg,#071633_0%,#102C58_55%,#101C48_100%)]" />
        <div className="absolute -right-20 top-0 -z-10 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-4 top-16 -z-10 h-56 w-56 rounded-full border border-white/10" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_340px]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-cyan-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Twimzi Business Desk
              </span>
              <h1 className="mt-6 max-w-3xl text-[2.65rem] font-extrabold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[4.25rem]">
                Know what&apos;s changing.
                <span className="mt-2 block bg-gradient-to-r from-[#D9B8FF] via-[#8FC5FF] to-[#8AF0F6] bg-clip-text text-transparent">Move your business forward.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100/80 sm:text-lg">
                The developments shaping Indian business — trade, exports, manufacturing and policy — in clear, source-linked briefings.
              </p>
              <form action="/news" className="mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/15 bg-white p-1.5 shadow-[0_16px_45px_rgba(0,0,0,.18)]">
                {category !== "All" && <input type="hidden" name="category" value={category} />}
                <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input name="q" defaultValue={query} placeholder="Search exports, GST, MSME, manufacturing..." className="h-11 min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label="Search business news" />
                </label>
                <button className="rounded-xl bg-gradient-to-r from-[#7000D6] to-[#1879FD] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110">Search</button>
              </form>
            </div>
            <div className="hidden rounded-[26px] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-md lg:block">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200"><TrendingUp className="h-4 w-4" /> In focus</div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">{total.toString().padStart(2, "0")}</p>
              <p className="mt-1 text-sm text-blue-100/75">Published briefings</p>
              <div className="my-5 h-px bg-white/15" />
              <div className="flex items-center justify-between text-sm"><span className="text-blue-100/70">Coverage areas</span><span className="font-bold text-white">03</span></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-400/15 px-3 py-1.5 text-xs font-semibold text-violet-100">Trade</span>
                <span className="rounded-full bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-100">Industry</span>
                <span className="rounded-full bg-orange-400/15 px-3 py-1.5 text-xs font-semibold text-orange-100">Policy</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-xs font-semibold text-blue-100/75">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Original sources linked</span>
            <span className="inline-flex items-center gap-2"><Newspaper className="h-4 w-4 text-cyan-200" /> Business-first summaries</span>
            <span className="inline-flex items-center gap-2"><Bookmark className="h-4 w-4 text-violet-200" /> Practical context, not noise</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-5 flex justify-end"><Link href="/news/saved" className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-50"><Bookmark className="h-4 w-4" /> Saved reading list</Link></div>
        <nav aria-label="News categories" className="flex flex-wrap gap-2">
          {categories.map(({ name, icon: Icon, tone }) => {
            const active = category === name;
            const activeStyle = tone === "violet" ? "border-violet-600 bg-violet-600" : tone === "cyan" ? "border-cyan-700 bg-cyan-700" : tone === "orange" ? "border-orange-500 bg-orange-500" : "border-[#14243D] bg-[#14243D]";
            return (
              <Link key={name} href={name === "All" ? "/news" : `/news?category=${encodeURIComponent(name)}`} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${active ? `${activeStyle} text-white shadow-sm` : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                <Icon className="h-4 w-4" />{name}
              </Link>
            );
          })}
        </nav>

        <div className="mb-6 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#7000D6]">The latest intelligence</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#14243D] sm:text-3xl">{query ? "Search results" : "Latest business briefings"}</h2>
            <p className="mt-2 text-sm text-slate-500">Clear updates. Credible sources. Better-informed decisions.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600">{total} {total === 1 ? "story" : "stories"}</span>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900">Business news is temporarily unavailable. Please try again shortly.</div>
        ) : featured ? (
          <>
            <article className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(30,55,110,0.05)] transition hover:shadow-[0_18px_48px_rgba(30,55,110,0.10)] lg:grid lg:grid-cols-[1.08fr_.92fr]">
              <Link href={`/news/${featured.slug}`} className="relative block min-h-[260px] overflow-hidden lg:min-h-[420px]" aria-label={`Read ${featured.title}`}>
                {featured.featured_image_url ? (
                  <NewsCoverImage src={featured.featured_image_url} alt={featured.title} category={featured.category} featured className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                ) : <NewsCoverImage alt={featured.title} category={featured.category} featured />}
                <span className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#263d70] shadow-sm backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-[#7000D6]" /> Lead story</span>
              </Link>
              <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className={`rounded-full border px-3 py-1.5 ${categoryTone(featured.category).pill}`}>{featured.category}</span>
                  <span>{formatDate(featured.published_at)}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{featured.reading_time_minutes} min read</span>
                </div>
                <h3 className="mt-5 text-[1.7rem] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#14243D] sm:text-3xl">
                  <Link href={`/news/${featured.slug}`} className="transition hover:text-[#1455C7]">{featured.title}</Link>
                </h3>
                <p className="mt-5 text-[15px] leading-8 text-slate-600">{featured.summary}</p>
                <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-5"><NewsActions item={{slug:featured.slug,title:featured.title,summary:featured.summary,category:featured.category,publishedAt:featured.published_at,url:`/news/${featured.slug}`}} /><div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Source: {featured.source_name}</span>
                  <Link href={`/news/${featured.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-[#14243D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1455C7]">Explore story <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
              </div>
            </article>

            {remaining.length > 0 && (
              <div className="mt-12">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><h2 className="text-xl font-extrabold tracking-tight text-[#14243D]">More to know</h2><p className="mt-1 text-sm text-slate-500">Recent updates across the business landscape</p></div>
                  <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">Latest first</span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {remaining.map((item) => <NewsCard key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1879FD]"><Search className="h-6 w-6" /></span>
            <h3 className="mt-5 text-xl font-extrabold text-[#14243D]">No stories found</h3>
            <p className="mt-2 text-sm text-slate-500">Try a different keyword or explore another topic.</p>
            <Link href="/news" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#14243D] px-5 py-3 text-sm font-bold text-white hover:bg-[#1455C7]">View all news <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}

        <section className="mt-14 overflow-hidden rounded-[26px] border border-[#E3E8F4] bg-white">
          <div className="grid gap-0 md:grid-cols-[1fr_auto] md:items-center">
            <div className="p-6 sm:p-8">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#7000D6]">Read with confidence</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#14243D]">Information first. Decisions with context.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Twimzi summarises developments and points you to the original publisher. Always review the official notification for complete terms, eligibility and effective dates before acting.</p>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 bg-gradient-to-r from-[#F7F0FF] via-[#F2F7FF] to-[#EEFBFF] px-6 py-5 md:h-full md:border-l md:border-t-0 sm:px-8">
              <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-600" />
              <div><p className="text-sm font-bold text-[#263d70]">Original source links</p><p className="mt-1 text-xs text-slate-500">Trace every update back to its publisher</p></div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
