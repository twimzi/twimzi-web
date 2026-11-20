import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { Container } from "@/components/ui/container";

export function BusinessCta() {
  return (
    <section className="py-8 pb-12 sm:py-10 sm:pb-14">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#e5dcff] bg-[linear-gradient(112deg,#faf6ff_0%,#f5f8ff_55%,#edfbff_100%)] px-6 py-8 shadow-[0_18px_55px_rgba(83,63,160,0.07)] sm:px-10 sm:py-10 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-[#8E07FB]/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-[28%] -z-10 h-56 w-56 rounded-full bg-[#05CDFC]/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(#1879FD_0.7px,transparent_0.7px)] [background-size:24px_24px] [mask-image:linear-gradient(270deg,black,transparent_70%)]" />

          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="relative z-10 max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-[#6d28d9] sm:text-sm">
                <span className="h-5 w-1 rounded-full bg-gradient-to-b from-[#8E07FB] to-[#05CDFC]" />
                For business owners
              </p>
              <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em] text-[#101747] sm:text-3xl lg:text-[2.35rem]">
                Put your business on the <span className="bg-gradient-to-r from-[#8E07FB] via-[#1879FD] to-[#05CDFC] bg-clip-text text-transparent">local map.</span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#53617d] sm:text-base sm:leading-8">
                Create your Twimzi presence and showcase your business, products, services, offers and updates to nearby customers.
              </p>
            </div>

            <Link
              href="/add-business"
              className="relative z-10 inline-flex min-h-13 shrink-0 items-center justify-center gap-3 self-start rounded-full bg-gradient-to-r from-[#8E07FB] via-[#4265F5] to-[#05BFEF] px-7 py-4 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(91,71,230,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(91,71,230,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8E07FB]/20 lg:self-center"
            >
              <Store className="h-4 w-4" /> Add your business <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
