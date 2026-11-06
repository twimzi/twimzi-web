
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
    <section className="twimzi-premium-hero relative isolate overflow-hidden bg-[#020D3A] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_12%,rgba(142,7,251,0.72),transparent_34%),radial-gradient(ellipse_at_100%_82%,rgba(5,205,252,0.64),transparent_36%),radial-gradient(ellipse_at_72%_18%,rgba(24,121,253,0.38),transparent_40%),linear-gradient(118deg,#08052F_0%,#020D3A_42%,#071B64_72%,#07113D_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(ellipse_at_8%_100%,rgba(142,7,251,0.56),transparent_36%),radial-gradient(ellipse_at_96%_0%,rgba(5,205,252,0.48),transparent_32%),linear-gradient(145deg,transparent_58%,rgba(24,121,253,0.18)_78%,transparent_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_52%_48%,rgba(24,121,253,0.22),transparent_48%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08052F]/35 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[25%] top-1/2 z-0 hidden h-[min(76vw,660px)] w-[min(76vw,660px)] -translate-y-1/2 lg:block xl:right-[23%]">
        <svg viewBox="0 0 640 640" className="h-full w-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="twimzi-earth-fill" cx="34%" cy="28%" r="76%">
              <stop offset="0" stopColor="#4CB9FF" stopOpacity=".98"/>
              <stop offset=".48" stopColor="#1267D9" stopOpacity=".96"/>
              <stop offset=".82" stopColor="#073B9D" stopOpacity=".98"/>
              <stop offset="1" stopColor="#031A55"/>
            </radialGradient>
            <radialGradient id="twimzi-earth-glow" cx="50%" cy="50%" r="50%">
              <stop offset=".68" stopColor="#05CDFC" stopOpacity="0"/>
              <stop offset=".88" stopColor="#1879FD" stopOpacity=".18"/>
              <stop offset="1" stopColor="#8E07FB" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="twimzi-land" x1="160" y1="140" x2="470" y2="500" gradientUnits="userSpaceOnUse">
              <stop stopColor="#B8F2FF" stopOpacity=".94"/>
              <stop offset="1" stopColor="#39A8FF" stopOpacity=".38"/>
            </linearGradient>
            <linearGradient id="twimzi-arc" x1="120" y1="180" x2="520" y2="470" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8E07FB"/>
              <stop offset=".5" stopColor="#05CDFC"/>
              <stop offset="1" stopColor="#1879FD"/>
            </linearGradient>
            <clipPath id="twimzi-earth-clip"><circle cx="320" cy="320" r="270"/></clipPath>
            <filter id="twimzi-earth-blur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="16"/>
            </filter>
            <filter id="twimzi-node-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="320" cy="320" r="302" fill="url(#twimzi-earth-glow)"/>
          <circle cx="320" cy="320" r="278" fill="#1879FD" opacity=".22" filter="url(#twimzi-earth-blur)"/>
          <circle cx="320" cy="320" r="270" fill="url(#twimzi-earth-fill)" stroke="#55CFFF" strokeWidth="4"/>
          <g clipPath="url(#twimzi-earth-clip)">
            <ellipse cx="320" cy="320" rx="116" ry="270" stroke="#9DEBFF" strokeOpacity=".3" strokeWidth="2"/>
            <ellipse cx="320" cy="320" rx="205" ry="270" stroke="#9DEBFF" strokeOpacity=".22" strokeWidth="2"/>
            <ellipse cx="320" cy="320" rx="270" ry="100" stroke="#9DEBFF" strokeOpacity=".26" strokeWidth="2"/>
            <ellipse cx="320" cy="320" rx="270" ry="184" stroke="#9DEBFF" strokeOpacity=".2" strokeWidth="2"/>
            <path d="M72 220 Q320 95 568 220M55 320H585M72 420Q320 545 568 420" stroke="#9DEBFF" strokeOpacity=".22" strokeWidth="2"/>
            <g fill="url(#twimzi-land)" stroke="#B5F4FF" strokeOpacity=".3" strokeWidth="2">
              <path d="M135 170 164 139 205 126 232 143 260 137 283 163 272 187 244 196 229 221 205 228 189 257 162 247 149 219 124 205Z"/>
              <path d="m242 254 35 8 24 34-10 44-18 26-8 53-22 38-20-25-4-52-20-35 9-47Z"/>
              <path d="m303 155 35-23 54 7 34 24 53 7 33 36-19 26-47-5-28 24-42-8-23 26-30-19-33 4-25-34 19-28Z"/>
              <path d="m365 265 34-23 39 11 19 31-15 29-35 6-21 29-28-15-15-34Z"/>
              <path d="m410 375 38-17 39 21 19 43-26 37-47-9-25-34Z"/>
              <path d="m495 270 27-8 22 20-11 25-29 4-17-19Z"/>
            </g>
            <g stroke="url(#twimzi-arc)" strokeWidth="3" strokeLinecap="round" opacity=".95">
              <path d="M155 286Q285 70 455 245"/>
              <path d="M176 410Q320 180 508 370"/>
              <path d="M205 190Q360 490 500 260"/>
              <path d="M110 340Q320 550 535 320"/>
            </g>
            <g fill="#B8F7FF" filter="url(#twimzi-node-glow)">
              <circle cx="155" cy="286" r="7"/><circle cx="455" cy="245" r="8"/>
              <circle cx="176" cy="410" r="6"/><circle cx="508" cy="370" r="8"/>
              <circle cx="205" cy="190" r="6"/><circle cx="500" cy="260" r="7"/>
              <circle cx="320" cy="320" r="9"/>
            </g>
            <circle cx="320" cy="320" r="270" fill="url(#twimzi-earth-glow)"/>
          </g>
          <circle cx="320" cy="320" r="270" stroke="#7FE8FF" strokeOpacity=".85" strokeWidth="2"/>
          <circle cx="320" cy="320" r="288" stroke="#1879FD" strokeOpacity=".28" strokeWidth="1.5" strokeDasharray="5 12"/>
        </svg>
      </div>
      <div className="relative z-10 mx-auto grid min-h-[720px] w-full max-w-[1760px] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 lg:min-h-[min(920px,calc(100svh-4rem))] lg:grid-cols-[minmax(0,1.35fr)_minmax(440px,.85fr)] lg:gap-12 lg:px-12 lg:py-16 xl:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
              <MapPin aria-hidden="true" size={18} strokeWidth={2.3} />
              Discover local. Grow local.
            </div>

            <h1 className="mt-7 max-w-[15ch] text-5xl font-bold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Your local world,
              <span className="block bg-gradient-to-r from-[#B77BFF] via-[#5AA5FF] to-[#63E7FF] bg-clip-text text-transparent">
                all in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100/90 sm:text-xl">
              {siteConfig.tagline}. Discover businesses, products, services,
              offers and opportunities around you.
            </p>

            <div className="mt-8 max-w-[960px] rounded-full border border-white/30 bg-white p-2 text-slate-900 shadow-[0_0_0_4px_rgba(142,7,251,0.18),0_18px_60px_rgba(2,13,58,0.28)]">
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
            <div className="relative z-10 ml-auto w-full max-w-[570px] rounded-[28px] border border-white/80 bg-white/95 p-5 text-slate-900 shadow-[0_32px_90px_rgba(1,14,40,0.35)] sm:p-6">
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
                      className="group flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-white/80 p-4 transition-colors hover:border-[var(--color-primary)]/40"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 text-[var(--color-primary)]">
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
