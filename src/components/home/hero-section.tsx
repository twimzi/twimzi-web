
import Link from "next/link";

import { ArrowRight, Flame, Megaphone, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
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
    <section className="relative isolate overflow-hidden bg-[#f5f9ff]">
      {/* Subtle brand artwork: soft aurora, dotted grid and orbital rings. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-36 h-[34rem] w-[34rem] rounded-full bg-blue-200/45 blur-[100px]" />
        <div className="absolute -bottom-48 left-[18%] h-[30rem] w-[30rem] rounded-full bg-cyan-100/70 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.28]" style={{ backgroundImage: "radial-gradient(#7da7e8 0.8px, transparent 0.8px)", backgroundSize: "22px 22px", maskImage: "linear-gradient(90deg, black, transparent 72%)" }} />
        <div className="absolute -right-24 top-16 h-[30rem] w-[30rem] rounded-full border border-blue-300/35" />
        <div className="absolute -right-8 top-32 h-[22rem] w-[22rem] rounded-full border border-blue-300/30" />
        <div className="absolute right-20 top-48 h-3 w-3 rounded-full bg-blue-400/70 shadow-[0_0_0_8px_rgba(96,165,250,0.12)]" />
        <div className="absolute right-[28%] top-28 h-2 w-2 rounded-full bg-cyan-500/60" />
      </div>

      <Container>
        <div className="relative grid min-h-[620px] items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-light)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-primary-dark)] shadow-[var(--shadow-sm)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
              />
              Discover local. Grow local.
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
              Your local world,
              <span className="block text-[var(--color-primary)]">
                all in one place.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              {siteConfig.tagline}. Discover businesses, products, services,
              offers and opportunities around you.
            </p>

            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-lg)]">
              <form
                action="/explore"
                method="get"
                className="flex flex-col gap-2 sm:flex-row"
              >
                <label className="sr-only" htmlFor="hero-search">
                  Search businesses, products or services
                </label>

                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  className="min-h-12 flex-1 rounded-xl bg-[var(--color-secondary)] px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  placeholder="Search businesses, products or services"
                />

                <label className="sr-only" htmlFor="hero-location">
                  Your location
                </label>

                <input
                  id="hero-location"
                  name="location"
                  type="text"
                  className="min-h-12 rounded-xl bg-[var(--color-secondary)] px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-primary)]/20 sm:w-48"
                  placeholder="Your location"
                />

                <Button type="submit" className="min-h-12 w-full sm:w-auto">
                  Search
                </Button>
              </form>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/explore">
                <Button>Explore Twimzi</Button>
              </Link>

              <Link href="/add-business">
                <Button variant="outline">Add Your Business</Button>
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
              <span>✓ Local businesses</span>
              <span>✓ Products &amp; services</span>
              <span>✓ Local offers</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-[430px] rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(30,64,175,0.13)] backdrop-blur-xl">
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
                      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-sm)]"
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
                        className="shrink-0 text-[var(--color-primary)] transition-transform group-hover:translate-x-1"
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
      </Container>
    </section>
  );
}
