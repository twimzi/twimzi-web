
import Link from "next/link";

import { ArrowRight, Compass, Flame, MapPin, Megaphone, Package, Search, Star, Store, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { GlobalNetworkGlobe } from "@/components/home/global-network-globe";

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
  {
    icon: "🏪",
    type: "New on Twimzi",
    title: "Discover local businesses",
    description: "Find businesses, products and services nearby.",
    href: "/businesses",
  },
  {
    icon: "⭐",
    type: "Featured",
    title: "Featured businesses",
    description: "Explore businesses highlighted on Twimzi.",
    href: "/businesses",
  },
  {
    icon: "🔥",
    type: "Latest Offer",
    title: "Local offers",
    description: "Discover offers from businesses around you.",
    href: "/offers",
  },
  {
    icon: "📢",
    type: "Latest Update",
    title: "Business updates",
    description: "See the latest updates from local businesses.",
    href: "/community",
  },
];

function getInterestingItemIcon(item: HeroInterestingItem) {
  const label = `${item.type} ${item.title}`.toLowerCase();

  if (label.includes("featured")) return Star;
  if (label.includes("offer")) return Flame;
  if (label.includes("update") || label.includes("community")) {
    return Megaphone;
  }

  return Store;
}

export function HeroSection({
  interestingItems = fallbackItems,
}: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#041A39] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/images/twimzi-hero-skyline.png')] bg-cover bg-center bg-no-repeat" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,17,43,0.94)_0%,rgba(5,25,58,0.76)_46%,rgba(5,23,55,0.56)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_54%_48%,rgba(37,99,235,0.20),transparent_46%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#03152f]/80 to-transparent" />
      <GlobalNetworkGlobe />
      <div className="relative z-10 mx-auto grid min-h-[720px] w-full max-w-[1760px] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 lg:min-h-[min(920px,calc(100svh-4rem))] lg:grid-cols-[minmax(0,1.35fr)_minmax(440px,.85fr)] lg:gap-12 lg:px-12 lg:py-16 xl:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/50 bg-blue-400/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              Discover local. Grow local.
            </div>

            <h1 className="mt-7 max-w-[15ch] text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Your local world,
              <span className="block bg-gradient-to-r from-sky-300 via-blue-300 to-white bg-clip-text text-transparent">
                all in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90 sm:text-xl">
              {siteConfig.tagline}. Discover businesses, products, services,
              offers and opportunities around you.
            </p>

            <div className="mt-8 max-w-[960px] rounded-full border border-blue-400 bg-white p-2 text-slate-900 shadow-[0_0_0_4px_rgba(37,99,235,0.16)]">
              <form action="/explore" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <label className="sr-only" htmlFor="hero-search">Search businesses, products or services</label>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={19} />
                  <input id="hero-search" name="q" type="search" className="min-h-14 w-full rounded-full bg-slate-50 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-[var(--color-primary)]/25" placeholder="Search businesses, products or services" />
                </div>
                <div className="relative sm:w-48 sm:shrink-0">
                  <label className="sr-only" htmlFor="hero-location">Your location</label>
                  <MapPin aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input id="hero-location" name="location" type="text" className="min-h-14 w-full rounded-full bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-[var(--color-primary)]/25" placeholder="Your location" />
                </div>
                <Button type="submit" className="min-h-14 w-full rounded-full sm:w-36">Search</Button>
              </form>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/explore">
                <Button className="min-h-14 gap-2 rounded-full px-6"><Compass aria-hidden="true" size={20} />Explore Twimzi</Button>
              </Link>

              <Link href="/add-business">
                <Button variant="outline" className="min-h-14 gap-2 rounded-full px-6"><Store aria-hidden="true" size={20} />Add Your Business</Button>
              </Link>
            </div>

            <div className="mt-8 grid max-w-[800px] grid-cols-3 gap-2 text-center text-xs font-semibold text-blue-50/90 sm:gap-6 sm:text-sm">
              <div className="flex flex-col items-center gap-2 sm:flex-row"><Store aria-hidden="true" size={22} /><span>Local businesses</span></div>
              <div className="flex flex-col items-center gap-2 sm:flex-row"><Package aria-hidden="true" size={22} /><span>Products &amp; services</span></div>
              <div className="flex flex-col items-center gap-2 sm:flex-row"><Tag aria-hidden="true" size={22} /><span>Local offers</span></div>
            </div>
          </div>

          <div className="relative hidden min-h-[600px] items-center justify-center lg:flex">
            <div className="relative z-10 ml-auto w-full max-w-[570px] rounded-[28px] border border-blue-100/80 bg-white p-5 text-slate-900 shadow-[0_32px_90px_rgba(1,14,40,0.35)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Fresh discoveries
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    What&apos;s happening on Twimzi
                  </h2>
                </div>

                <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                  Local
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {interestingItems.slice(0, 4).map((item) => {
                  const Icon = getInterestingItemIcon(item);

                  return (
                    <Link
                      key={`${item.type}-${item.title}`}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-primary)]/40"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                        <Icon
                          aria-hidden="true"
                          size={23}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                          {item.type}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold">
                          {item.title}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-text-muted)]">
                          {item.description}
                        </p>
                      </div>

                      <ArrowRight
                        aria-hidden="true"
                        className="shrink-0 text-[var(--color-primary)] "
                        size={18}
                        strokeWidth={1.8}
                      />
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
