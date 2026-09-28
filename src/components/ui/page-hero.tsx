import { Container } from "@/components/ui/container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
}: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-secondary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[var(--color-primary-light)] opacity-80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-[var(--color-accent-light)] opacity-60 blur-3xl"
      />

      <Container>
        <div className="relative py-14 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-light)] bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)] shadow-[var(--shadow-xs)] backdrop-blur">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
              />

              {eyebrow}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
              {description}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}