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
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[var(--color-brand-gradient)] opacity-[0.055]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[var(--color-primary-light)] opacity-90 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[var(--color-accent-light)] opacity-75 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[var(--color-primary-light)] opacity-50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[var(--color-brand-gradient)]"
      />

      <Container>
        <div className="relative py-14 sm:py-16 lg:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-primary-dark)] shadow-[var(--shadow-sm)] backdrop-blur">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-light)]"
              />

              {eyebrow}
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
              {description}
            </p>

            <div className="mt-7 flex items-center gap-2">
              <span className="h-1.5 w-12 rounded-full bg-[var(--color-primary)]" />
              <span className="h-1.5 w-5 rounded-full bg-[var(--color-accent)]" />
              <span className="h-1.5 w-2 rounded-full bg-[var(--color-primary-dark)]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
