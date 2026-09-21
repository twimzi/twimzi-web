import Link from "next/link";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const items = [
  {
    icon: "B",
    name: "Local Business Hub",
    meta: "Businesses · Ludhiana",
    description:
      "Explore products, services and updates from local businesses.",
    href: "/businesses",
  },
  {
    icon: "P",
    name: "Industrial Fasteners",
    meta: "Products · Local sellers",
    description:
      "Browse nuts, bolts, washers and industrial components from local sellers.",
    href: "/products",
  },
  {
    icon: "S",
    name: "Professional Services",
    meta: "Services · Nearby",
    description:
      "Discover services and connect with businesses for your next need.",
    href: "/services",
  },
];

export function DiscoverySection() {
  return (
    <section className="bg-[var(--color-secondary)] py-20">
      <Container>
        <SectionHeading
          eyebrow="What's happening"
          title="Discover what's useful nearby"
          description="Twimzi brings business discovery, products, services and local updates into one simple experience."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.name}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-lg font-bold text-[var(--color-primary)]">
                {item.icon}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                {item.meta}
              </p>

              <h3 className="mt-2 text-xl font-bold">{item.name}</h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.description}
              </p>

              <Link
                href={item.href}
                className="mt-5 inline-flex items-center text-sm font-semibold text-[var(--color-primary)] transition hover:gap-2"
              >
                Explore <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}