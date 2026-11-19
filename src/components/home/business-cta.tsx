import Link from "next/link";
import { Container } from "@/components/ui/container";

export function BusinessCta() {
  return (
    <section className="py-12 sm:py-14">
      <Container>
        <div className="twimzi-home-cta relative overflow-hidden rounded-[2rem] px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-[#8E07FB]/25 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <p className="twimzi-home-cta-eyebrow text-sm font-bold uppercase tracking-[.16em]">
              For business owners
            </p>

            <h2 className="twimzi-gradient-heading mt-3 text-3xl font-bold sm:text-4xl">
              Put your business on the local map.
            </h2>

            <p className="mt-4 text-base leading-7 text-white/80">
              Create your Twimzi presence and showcase your business, products,
              services, offers and updates to nearby customers.
            </p>
          </div>

          <Link
            href="/add-business"
            className="relative z-10 mt-8 inline-flex min-h-14 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-extrabold text-[#101747] shadow-lg transition hover:bg-[#eef6ff] lg:mt-0"
          >
            Register Your Business
          </Link>
        </div>
      </Container>
    </section>
  );
}