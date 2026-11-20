import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Flame,
  MapPin,
  Megaphone,
  Package,
  Search,
  Star,
  Store,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export type HeroInterestingItem = {
  icon: string;
  type: string;
  title: string;
  description: string;
  href: string;
};

type HeroSectionProps = {
  interestingItems?: HeroInterestingItem[];
};

const fallbackItems: HeroInterestingItem[] = [
  { icon: "🏪", type: "New on Twimzi", title: "Discover local businesses", description: "Find businesses, products and services nearby.", href: "/businesses" },
  { icon: "⭐", type: "Featured", title: "Featured businesses", description: "Explore businesses highlighted on Twimzi.", href: "/businesses" },
  { icon: "🔥", type: "Latest Offer", title: "Local offers", description: "Discover offers from businesses around you.", href: "/offers" },
  { icon: "📢", type: "Latest Update", title: "Business updates", description: "See the latest updates from local businesses.", href: "/community" },
];

function getInterestingItemIcon(item: HeroInterestingItem) {
  const label = `${item.type} ${item.title}`.toLowerCase();
  if (label.includes("featured")) return Star;
  if (label.includes("offer")) return Flame;
  if (label.includes("update") || label.includes("community")) return Megaphone;
  return Store;
}

export function HeroSection({ interestingItems = fallbackItems }: HeroSectionProps) {
  return (
    <section className="twimzi-home-hero relative isolate overflow-hidden text-slate-900">
      <div className="twimzi-home-hero-inner relative z-10 mx-auto w-full">
        <div className="twimzi-hero-search rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(38,74,145,.08)]">
          <form action="/explore" method="get" className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_190px_136px]">
            <div className="relative min-w-0">
              <label className="sr-only" htmlFor="hero-search">Search businesses, products or services</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input id="hero-search" name="q" type="search" className="h-13 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70" placeholder="Search businesses, products or services" />
            </div>
            <div className="relative min-w-0">
              <label className="sr-only" htmlFor="hero-location">Your location</label>
              <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input id="hero-location" name="location" type="text" className="h-13 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70" placeholder="Your location" />
            </div>
            <Button type="submit" className="h-13 w-full rounded-xl">Search</Button>
          </form>
        </div>

        <div className="twimzi-home-hero-main min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D9FF] bg-white/90 px-3.5 py-2 text-xs font-bold tracking-wide text-[#7000D6] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#8E07FB] to-[#05CDFC]" />
            Discover local. Grow local.
          </div>
          <h1 className="mt-4 max-w-[14ch] text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[#020D3A] sm:text-5xl xl:text-[4rem]">
            Your local world,
            <span className="block bg-gradient-to-r from-[#8E07FB] via-[#1879FD] to-[#05CDFC] bg-clip-text text-transparent">all in one place.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#53627E] sm:text-lg sm:leading-8">
            {siteConfig.tagline}. Discover businesses, products, services, offers and opportunities around you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/explore">
              <Button className="min-h-13 gap-2 rounded-full px-6"><Compass aria-hidden="true" size={19} />Explore Twimzi<ArrowRight aria-hidden="true" size={17} /></Button>
            </Link>
            <Link href="/add-business">
              <Button variant="outline" className="min-h-13 gap-2 rounded-full border-slate-200 bg-white px-6 text-[#020D3A] hover:bg-white"><Store aria-hidden="true" size={19} />Add Your Business</Button>
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#53627E]">
            <div className="flex items-center gap-2"><Store aria-hidden="true" className="text-[#1879FD]" size={19} /><span>Local businesses</span></div>
            <div className="flex items-center gap-2"><Package aria-hidden="true" className="text-[#1879FD]" size={19} /><span>Products &amp; services</span></div>
            <div className="flex items-center gap-2"><Tag aria-hidden="true" className="text-[#1879FD]" size={19} /><span>Local offers</span></div>
          </div>
        </div>

        <aside className="twimzi-home-hero-discoveries relative w-full min-w-0 rounded-[26px] border border-white/90 bg-white/95 p-5 text-slate-900 shadow-[0_18px_48px_rgba(30,68,130,.10)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1879FD]">Fresh discoveries</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#020D3A]">What&apos;s happening on Twimzi</h2>
            </div>
            <span className="shrink-0 rounded-full bg-[#F1F4FF] px-3 py-1 text-xs font-semibold text-[#1879FD]">Local</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {interestingItems.slice(0, 4).map((item) => {
              const Icon = getInterestingItemIcon(item);
              return (
                <Link key={`${item.type}-${item.title}`} href={item.href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#E8EDF6] bg-white p-3 transition-colors duration-200 hover:border-[#C9D9FF] hover:bg-[#FBFCFF]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5FF] text-[#1879FD]">
                    <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1879FD]">{item.type}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-[#020D3A]">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">{item.description}</p>
                  </div>
                  <ArrowRight aria-hidden="true" className="shrink-0 text-[#1879FD] transition-transform group-hover:translate-x-1" size={17} />
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
