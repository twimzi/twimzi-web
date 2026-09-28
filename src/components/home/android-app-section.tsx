import Link from "next/link";
import Image from "next/image";

import { Container } from "@/components/ui/container";

export function AndroidAppSection() {
  return (
    <section className="py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--color-primary)] px-7 py-12 text-white sm:px-12 lg:px-16">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              {/* Coming Soon */}
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
                <span className="animate-pulse">Coming Soon</span>
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Twimzi is coming to Android.
              </h2>

              <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg">
                Discover local businesses, products, services, offers and
                updates wherever you go — right from the Twimzi mobile app.
              </p>

              {/* Android CTA */}
              <Link
                href="/"
                className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-lg transition hover:scale-[1.02] hover:bg-white/95"
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.2 11.8 5.4 4.1c-.3.3-.4.8-.4 1.4v13c0 .6.1 1.1.4 1.4l7.8-7.7Z"
                      fill="#34A853"
                    />
                    <path
                      d="m15.8 14.4-2.6-2.6-7.8 7.7c.4.4 1 .4 1.6.1l8.8-5.2Z"
                      fill="#FBBC04"
                    />
                    <path
                      d="m15.8 9.6-8.8-5.2c-.6-.3-1.2-.3-1.6.1l7.8 7.7 2.6-2.6Z"
                      fill="#EA4335"
                    />
                    <path
                      d="m18.7 11.3-2.9-1.7-2.6 2.6 2.6 2.6 2.9-1.7c.8-.5.8-1.3 0-1.8Z"
                      fill="#4285F4"
                    />
                  </svg>
                </span>

                <span className="text-sm font-extrabold text-emerald-600 sm:text-base">
                  Android App Coming Soon
                </span>
              </Link>
            </div>

            {/* Mobile phone */}
            <div className="mx-auto lg:mr-8">
              <div className="relative flex h-56 w-36 items-center justify-center rounded-[2.4rem] border-4 border-white/30 bg-white/10 p-2 shadow-2xl backdrop-blur-sm sm:h-64 sm:w-40">
                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[1.8rem] bg-white">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-emerald-50"
                  />

                  {/* Full circular Twimzi logo */}
                  <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-3 shadow-lg ring-4 ring-[var(--color-primary)]/20">
                    <Image
                      src="/twimzi-logo.png"
                      alt="Twimzi"
                      width={64}
                      height={64}
                      priority
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <span className="relative mt-4 text-[11px] font-extrabold tracking-[0.2em] text-[var(--color-primary)]">
                    TWIMZI
                  </span>

                  <span className="relative mt-2 px-2 text-center text-[8px] font-medium text-slate-400">
                    Local. Connected. Twimzi.
                  </span>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="mx-auto -mt-6 h-8 w-28 rounded-full bg-black/20 blur-xl"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}