import Link from "next/link";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

const categories = [
  {
    title: "Manufacturers",
    description: "Discover local manufacturers and production businesses.",
    href: "/businesses?type=manufacturer",
  },
  {
    title: "Traders & Wholesalers",
    description: "Find traders, distributors and wholesale suppliers.",
    href: "/businesses?type=trader",
  },
  {
    title: "Professionals",
    description: "Connect with accountants, lawyers, consultants and more.",
    href: "/businesses?type=professional",
  },
  {
    title: "Home Services",
    description: "Find trusted providers for work at home or nearby.",
    href: "/services",
  },
  {
    title: "Local Shops",
    description: "Explore shops and businesses serving your area.",
    href: "/businesses?type=shop",
  },
  {
    title: "Restaurants",
    description: "Discover local restaurants and food businesses.",
    href: "/businesses?type=restaurant",
  },
  {
    title: "Products",
    description: "Browse products offered by local businesses.",
    href: "/products",
  },
  {
    title: "Services",
    description: "Explore professional and local services.",
    href: "/services",
  },
];

const quickLinks = [
  {
    title: "All Businesses",
    description: "Browse businesses available on Twimzi.",
    href: "/businesses",
  },
  {
    title: "Products",
    description: "Discover products from local businesses.",
    href: "/products",
  },
  {
    title: "Services",
    description: "Find services offered by local providers.",
    href: "/services",
  },
  {
    title: "Offers",
    description: "See current offers from businesses.",
    href: "/offers",
  },
];

export default function Explore() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Find what you need, close to you."
        description="Search local businesses, products and services from one connected discovery experience."
      />

      <Container>
        <section className="py-12">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Discover
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Explore by business type
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Find the type of local business you are looking for and continue
              directly to relevant listings.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group rounded-2xl border border-[var(--color-border)] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-lg)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary)]">
                  {category.title.slice(0, 1)}
                </div>

                <h3 className="mt-5 font-bold">{category.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {category.description}
                </p>

                <span className="mt-5 block text-xs font-semibold text-[var(--color-primary)]">
                  Explore now →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] py-12">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Quick access
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Start discovering
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-[var(--color-border)] p-6 transition hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]"
              >
                <h3 className="font-bold">{item.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                  {item.description}
                </p>

                <span className="mt-4 block text-xs font-semibold text-[var(--color-primary)]">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}