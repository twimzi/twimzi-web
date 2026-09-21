import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const discoveryItems = [
  {
    icon: "M",
    title: "Manufacturers",
    description: "Find local suppliers and makers",
  },
  {
    icon: "T",
    title: "Traders & Wholesalers",
    description: "Source products from local sellers",
  },
  {
    icon: "S",
    title: "Services",
    description: "Connect with local professionals",
  },
  {
    icon: "O",
    title: "Offers",
    description: "Discover what's happening nearby",
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)]">
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-primary-light)] opacity-70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[var(--color-accent-light)] opacity-50 blur-3xl"
      />

      <Container>
        <div className="relative grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="hero-search">
                  Search businesses, products or services
                </label>

                <input
                  id="hero-search"
                  name="search"
                  className="min-h-12 flex-1 rounded-xl bg-[var(--color-secondary)] px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  placeholder="Search businesses, products or services"
                />

                <label className="sr-only" htmlFor="hero-location">
                  Your location
                </label>

                <input
                  id="hero-location"
                  name="location"
                  className="min-h-12 rounded-xl bg-[var(--color-secondary)] px-4 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-primary)]/20 sm:w-48"
                  placeholder="Your location"
                />

                <Link href="/explore">
                  <Button className="min-h-12 w-full sm:w-auto">
                    Search
                  </Button>
                </Link>
              </div>
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
            <div className="ml-auto max-w-[430px] rounded-[2rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Discover nearby
                  </p>

                  <h2 className="mt-1 text-xl font-bold">Popular today</h2>
                </div>

                <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                  Local
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {discoveryItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-sm font-bold text-[var(--color-primary)]">
                      {item.icon}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>

                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}