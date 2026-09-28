import Link from "next/link";
import { Container } from "@/components/ui/container";

export function BusinessCta() {
  return (
    <section className="py-20">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-[var(--color-primary)] px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-[var(--color-primary-light)]">
              For business owners
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Put your business on the local map.
            </h2>

            <p className="mt-4 text-base leading-7 text-white/80">
              Create your Twimzi presence and showcase your business, products,
              services, offers and updates to nearby customers.
            </p>
          </div>

          <Link
            href="/add-business"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] bg-white px-5 py-2.5 text-sm font-bold !text-[var(--color-primary-dark)] shadow-sm transition-all hover:bg-[var(--color-primary-light)] hover:!text-[var(--color-primary-dark)] animate-pulse lg:mt-0"
          >
            Register Your Business
          </Link>
        </div>
      </Container>
    </section>
  );
}