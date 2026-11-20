import Image from "next/image";
import Link from "next/link";

import { ArrowRight, Compass, Flame, MapPin, Megaphone, Package, Search, Star, Store, Tag } from "lucide-react";
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
      <div className="twimzi-hero-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <div className="twimzi-hero-search w-full max-w-[760px] rounded-[1.5rem] border border-white/90 bg-white/90 p-2 shadow-[0_12px_36px_rgba(38,74,145,.12)] backdrop-blur-xl">
          <form action="/explore" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="hero-search">Search businesses, products or services</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
              <input id="hero-search" name="q" type="search" className="min-h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70" placeholder="Search businesses, products or services" />
            </div>
            <div className="relative sm:w-48 sm:shrink-0">
              <label className="sr-only" htmlFor="hero-location">Your location</label>
              <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input id="hero-location" name="location" type="text" className="min-h-14 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70" placeholder="Your location" />
            </div>
            <Button type="submit" className="min-h-14 w-full rounded-xl sm:w-36">Search</Button>
          </form>
        </div>

        <div className="mt-7 grid items-center gap-7 xl:grid-cols-[minmax(0,1.03fr)_minmax(360px,.98fr)_minmax(340px,.88fr)] xl:gap-8">
          <div className="relative z-10 max-w-[650px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-4 py-2 text-sm font-semibold text-[#2456D9] shadow-sm backdrop-blur">
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              Discover local. Grow local.
            </div>

            <h1 className="mt-5 max-w-[15ch] text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-[#020D3A] sm:text-5xl lg:text-6xl xl:text-[4.35rem]">
              Your local world,
              <span className="block bg-gradient-to-r from-[#8E07FB] via-[#1879FD] to-[#05CDFC] bg-clip-text text-transparent">all in one place.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#344365] sm:text-lg sm:leading-8">
              {siteConfig.tagline}. Discover businesses, products, services, offers and opportunities around you.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/explore">
                <Button className="min-h-14 gap-2 rounded-full px-6"><Compass aria-hidden="true" size={20} />Explore Twimzi</Button>
              </Link>
              <Link href="/add-business">
                <Button variant="outline" className="min-h-14 gap-2 rounded-full border-slate-200 bg-white/80 px-6 text-[#020D3A] hover:bg-white"><Store aria-hidden="true" size={20} />Add Your Business</Button>
              </Link>
            </div>

            <div className="mt-8 grid max-w-[620px] grid-cols-3 gap-3 text-xs font-semibold text-[#344365] sm:gap-5 sm:text-sm">
              <div className="flex items-center gap-2"><Store aria-hidden="true" className="shrink-0 text-[#1879FD]" size={21} /><span>Local businesses</span></div>
              <div className="flex items-center gap-2"><Package aria-hidden="true" className="shrink-0 text-[#1879FD]" size={21} /><span>Products &amp; services</span></div>
              <div className="flex items-center gap-2"><Tag aria-hidden="true" className="shrink-0 text-[#1879FD]" size={21} /><span>Local offers</span></div>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[650px] items-center justify-center xl:min-h-[520px]">
            <div className="twimzi-hero-art-glow pointer-events-none absolute inset-[8%] rounded-full" aria-hidden="true" />
            <Image
              src="/images/twimzi-global-logistics-clean.webp"
              alt="A globe connected by global air, road and rail transport, representing Twimzi's global business reach"
              width={1536}
              height={1024}
              priority
              sizes="(min-width: 1280px) 34vw, (min-width: 640px) 70vw, 100vw"
              className="relative z-[1] h-auto w-full max-w-[650px] object-contain drop-shadow-[0_24px_38px_rgba(25,75,150,.16)]"
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[450px] rounded-[28px] border border-white/90 bg-white/90 p-5 text-slate-900 shadow-[0_22px_65px_rgba(30,68,130,.13)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#1879FD]">Fresh discoveries</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[#020D3A]">What&apos;s happening on Twimzi</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1879FD]">Local</span>
            </div>

            <div className="mt-5 space-y-3">
              {interestingItems.slice(0, 4).map((item) => {
                const Icon = getInterestingItemIcon(item);
                return (
                  <Link key={`${item.type}-${item.title}`} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(24,121,253,.10)]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 text-[#1879FD]">
                      <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1879FD]">{item.type}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#020D3A]">{item.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-[#64748B]">{item.description}</p>
                    </div>
                    <ArrowRight aria-hidden="true" className="shrink-0 text-[#1879FD] transition-transform group-hover:translate-x-1" size={18} strokeWidth={1.8} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
