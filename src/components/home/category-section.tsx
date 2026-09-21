import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const categories = [
  {
    icon: "M",
    title: "Manufacturers",
    description: "Find makers and suppliers",
    href: "/explore?category=manufacturer",
  },
  {
    icon: "T",
    title: "Traders & Wholesalers",
    description: "Source products locally",
    href: "/explore?category=trader",
  },
  {
    icon: "P",
    title: "Professionals",
    description: "CA, lawyers, doctors & more",
    href: "/explore?category=professional",
  },
  {
    icon: "H",
    title: "Home Services",
    description: "Trusted help near you",
    href: "/explore?category=home-service",
  },
  {
    icon: "S",
    title: "Local Shops",
    description: "Discover nearby stores",
    href: "/explore?category=shop",
  },
  {
    icon: "R",
    title: "Restaurants",
    description: "Find places to eat",
    href: "/explore?category=restaurant",
  },
  {
    icon: "P",
    title: "Products",
    description: "Explore local products",
    href: "/products",
  },
  {
    icon: "S",
    title: "Services",
    description: "Find the right service",
    href: "/services",
  },
];

export function CategorySection() {
  return (
    <section className="py-20">
      <Container>
        <SectionHeading
          eyebrow="Discover"
          title="Explore by category"
          description="Find the people, businesses, products and services that make your local community work."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={category.href}
              key={category.title}
              className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-lg font-bold text-[var(--color-primary)] transition group-hover:bg-[var(--color-primary-light)]">
                {category.icon}
              </div>

              <h3 className="mt-5 text-base font-semibold">
                {category.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}