import Link from "next/link";
import { ArrowRight, CheckCircle2, Store } from "lucide-react";
import { Container } from "@/components/ui/container";

const benefits = [
  "Create a public business profile",
  "Showcase your products and services",
  "Help customers discover your business",
];

export function BusinessCta() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#BDE5DF] bg-[linear-gradient(115deg,#F0FAF8_0%,#FFFFFF_58%,#FFF4EB_100%)] px-6 py-9 shadow-[0_18px_55px_rgba(13,148,136,0.09)] sm:px-10 sm:py-12 lg:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-[#0D9488]/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-[25%] -z-10 h-60 w-60 rounded-full bg-[#F97316]/10 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#BDE5DF] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.15em] text-[#087F75]">
                <Store className="h-4 w-4 text-[#F97316]" /> For Indian business owners
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#14243D] sm:text-4xl">
                Get your business discovered.
                <span className="block text-[#0D9488]">Create your free listing.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#526176] sm:text-base">
                Give your business a place on Twimzi. Create a profile, tell people what you offer and make it easier for customers and business buyers to find you.
              </p>
              <ul className="mt-5 grid gap-3 text-sm font-medium text-[#334155] sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0D9488]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-[#64748B]">
                Free to get started. Submitted profiles are reviewed before they appear publicly. No leads or sales are guaranteed.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/free-business-listing-india"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#0D9488]/15 transition hover:-translate-y-0.5 hover:bg-[#087F75] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0D9488]/20"
              >
                Learn about free listing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/add-business"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F97316]/20"
              >
                List your business free <Store className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
