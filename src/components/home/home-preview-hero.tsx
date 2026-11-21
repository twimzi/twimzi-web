import Link from "next/link";
import { ArrowRight, Search, MapPin, Store, Factory, Package, BriefcaseBusiness, ShoppingBag } from "lucide-react";

const discovery = [
  { label: "Manufacturers", detail: "Find factories and producers", href: "/businesses?type=manufacturer", icon: Factory },
  { label: "Wholesalers", detail: "Explore suppliers and traders", href: "/businesses?type=wholesaler", icon: Package },
  { label: "Local businesses", detail: "Discover shops and services", href: "/businesses", icon: Store },
  { label: "Products & services", detail: "Browse what businesses offer", href: "/products", icon: ShoppingBag },
];

export function HomePreviewHero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(13,148,136,0.16),_transparent_42%),linear-gradient(135deg,#F7FCFB_0%,#FFFFFF_58%,#F0F9F8_100%)]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BDE5DF] bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#087F75] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" /> India&apos;s business discovery network
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] text-[#14243D] sm:text-5xl lg:text-[3.75rem]">
            Discover businesses.
            <span className="block text-[#0D9488]">Find suppliers.</span>
            <span className="block">Grow together.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#526176] sm:text-lg">
            Explore manufacturers, wholesalers, local businesses, products and services — all in one place.
          </p>
          <form action="/explore" method="get" className="mt-8 rounded-2xl border border-[#DDE9E7] bg-white p-2 shadow-[0_18px_55px_rgba(20,70,65,0.10)]">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(180px,.7fr)_auto]">
              <label className="flex min-h-14 items-center gap-3 rounded-xl px-3 focus-within:ring-2 focus-within:ring-[#0D9488]/30">
                <Search className="shrink-0 text-[#F97316]" size={20} />
                <input name="q" type="search" placeholder="What are you looking for?" className="w-full bg-transparent text-sm text-[#14243D] outline-none placeholder:text-[#84919E]" />
              </label>
              <label className="flex min-h-14 items-center gap-3 rounded-xl border border-[#E8EFEE] px-3 focus-within:ring-2 focus-within:ring-[#0D9488]/30">
                <MapPin className="shrink-0 text-[#F97316]" size={19} />
                <input name="location" placeholder="City or location" className="w-full bg-transparent text-sm text-[#14243D] outline-none placeholder:text-[#84919E]" />
              </label>
              <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-7 text-sm font-bold text-white transition hover:bg-[#EA580C]">
                Search <ArrowRight size={17} />
              </button>
            </div>
          </form>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#526176]">
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Discover businesses</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Explore products</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Connect with suppliers</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/businesses" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#14243D] px-6 text-sm font-bold text-white transition hover:bg-[#233B5D]">Explore businesses <ArrowRight size={16} /></Link>
            <Link href="/add-business" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#FDBA74] bg-white px-6 text-sm font-bold text-[#EA580C] transition hover:bg-[#FFF7ED]"><Store size={17} /> List your business free</Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-[#0D9488]/[0.06] blur-2xl" />
          <div className="relative rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_25px_70px_rgba(20,70,65,0.12)] sm:p-7">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0D9488]">Explore Twimzi</p><h2 className="mt-1 text-xl font-extrabold text-[#14243D]">Find what your business needs</h2></div>
              <span className="rounded-full bg-[#E8F7F4] px-3 py-1 text-xs font-bold text-[#087F75]">Discover</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {discovery.map(({ label, detail, href, icon: Icon }) => (
                <Link key={label} href={href} className="group rounded-2xl border border-[#E7EFED] bg-white p-4 transition hover:-translate-y-1 hover:border-[#9DD8CE] hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF1E7] text-[#F97316]"><Icon size={22} /></span>
                  <h3 className="mt-4 font-bold text-[#14243D]">{label}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#718096]">{detail}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0D9488]">Explore <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#F0FAF8] p-4">
              <div className="flex items-center gap-3"><BriefcaseBusiness className="text-[#0D9488]" size={22} /><div><p className="text-sm font-bold text-[#14243D]">Are you a business owner?</p><p className="mt-0.5 text-xs text-[#64748B]">Create your profile and get discovered.</p></div></div>
              <Link href="/add-business" className="mt-3 inline-flex text-xs font-extrabold text-[#087F75]">Create a free listing <ArrowRight size={14} className="ml-1" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
