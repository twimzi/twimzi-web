import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

const directions = [
  "Better local business visibility",
  "Simple product and service discovery",
  "Useful local offers and updates",
  "A stronger connection between businesses and communities",
];

const pillars = [
  {
    title: "Discover",
    description:
      "Help people find relevant local businesses, products and services in one connected experience.",
  },
  {
    title: "Present",
    description:
      "Give businesses a practical digital presence where they can showcase what they offer.",
  },
  {
    title: "Connect",
    description:
      "Create better ways for customers and businesses to stay connected with their local community.",
  },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About Twimzi"
        title="A digital operating system for every local business."
        description="Twimzi is designed to make local discovery and business growth simpler by bringing the important parts of a business presence together."
      />

      <Container>
        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Why Twimzi
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built around local discovery.
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-[var(--color-text-secondary)]">
              Customers should be able to discover businesses, products,
              services and offers without jumping between disconnected
              platforms. Businesses should have one place to present what they
              do and stay connected with their local audience.
            </p>

            <p className="mt-5 max-w-2xl leading-8 text-[var(--color-text-secondary)]">
              Twimzi brings these experiences together into a connected local
              platform designed for businesses and the communities they serve.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Our direction
            </p>

            <h3 className="mt-3 text-2xl font-bold">
              Making local business discovery simpler.
            </h3>

            <ul className="mt-6 space-y-4">
              {directions.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-secondary)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white"
                  >
                    ✓
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              One connected experience
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From discovery to connection.
            </h2>

            <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">
              Twimzi is being built around the everyday needs of local
              businesses and the people looking for them.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-sm)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-sm font-bold text-white">
                  {pillar.title.charAt(0)}
                </div>

                <h3 className="mt-5 text-xl font-bold">{pillar.title}</h3>

                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="rounded-3xl bg-[var(--color-primary)] px-7 py-10 text-white sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] opacity-80">
              Twimzi
            </p>

            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              A simpler digital presence for local businesses.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 opacity-90">
              Discover businesses. Explore products and services. Find local
              offers. Stay connected with the businesses that matter to your
              community.
            </p>
          </div>
        </section>
      </Container>
    </>
  );
}