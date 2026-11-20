import Link from "next/link";
import Image from "next/image";
import { Bell, Smartphone, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";

export function AndroidAppSection() {
  return (
    <section className="py-10 sm:py-12">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#e7ddff] bg-[linear-gradient(115deg,#fbf7ff_0%,#f7f9ff_52%,#effbff_100%)] px-6 py-9 shadow-[0_18px_55px_rgba(83,63,160,0.08)] sm:px-10 sm:py-11 lg:px-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-[#8E07FB]/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[34%] -z-10 h-72 w-72 rounded-full bg-[#05CDFC]/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(#8E07FB_0.7px,transparent_0.7px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,black,transparent_65%)]" />

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c8ff] bg-white/80 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6d28d9] shadow-sm">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8E07FB] opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#8E07FB]" /></span>
                Coming soon
              </div>

              <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.08] tracking-[-0.045em] text-[#101747] sm:text-4xl lg:text-[2.8rem]">
                Twimzi is coming to <span className="bg-gradient-to-r from-[#8E07FB] via-[#1879FD] to-[#05CDFC] bg-clip-text text-transparent">Android.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#53617d] sm:text-lg sm:leading-8">
                Discover local businesses, products, services, offers and updates wherever you go — right from the Twimzi mobile app.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/" className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-gradient-to-r from-[#8E07FB] via-[#4265F5] to-[#05BFEF] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(91,71,230,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(91,71,230,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8E07FB]/20">
                  <Bell className="h-4 w-4" /> Android app coming soon <ArrowUpRight className="h-4 w-4" />
                </Link>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#66738d]"><Smartphone className="h-4 w-4 text-[#1879FD]" /> Built for discovering local, on the go</span>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[230px] items-center justify-center lg:mr-3">
              <div aria-hidden="true" className="absolute inset-2 rounded-full bg-gradient-to-br from-[#8E07FB]/15 via-[#1879FD]/10 to-[#05CDFC]/20 blur-2xl" />
              <div aria-hidden="true" className="absolute h-52 w-52 rounded-full border border-[#8E07FB]/15" />
              <div aria-hidden="true" className="absolute h-44 w-44 rounded-full border border-[#1879FD]/15" />
              <div className="relative w-[142px] rounded-[2.2rem] border-[5px] border-[#17213c] bg-[#17213c] p-1.5 shadow-[0_22px_42px_rgba(31,41,80,0.2)] sm:w-[154px]">
                <div className="relative flex aspect-[9/18] flex-col items-center justify-center overflow-hidden rounded-[1.7rem] bg-white">
                  <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(155deg,#ffffff_0%,#f6f2ff_58%,#eafaff_100%)]" />
                  <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-[0_5px_20px_rgba(50,70,130,0.08)]">
                    <Image src="/twimzi-logo.png" alt="Twimzi" width={64} height={64} className="h-14 w-14 object-contain" />
                  </div>
                  <span className="relative mt-4 text-[10px] font-black tracking-[0.22em] text-[#172554]">TWIMZI</span>
                  <span className="relative mt-2 text-center text-[8px] font-medium text-[#75819b]">Local. Connected. Twimzi.</span>
                  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-r from-[#8E07FB]/15 via-[#1879FD]/10 to-[#05CDFC]/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
