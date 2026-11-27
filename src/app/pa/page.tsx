import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

const canonical = `${siteConfig.url}/pa`;

export const metadata: Metadata = {
  title: "ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੀ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ ਅਤੇ B2B ਮਾਰਕੀਟਪਲੇਸ | Twimzi",
  description: "Twimzi ’ਤੇ ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਨਿਰਮਾਤਾ, ਥੋਕ ਵਿਕਰੇਤਾ, ਸਪਲਾਇਰ, ਵਪਾਰੀ ਅਤੇ ਸਥਾਨਕ ਕਾਰੋਬਾਰ ਲੱਭੋ। ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਵੇਖੋ ਅਤੇ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰੋ।",
  keywords: [
    "ਪੰਜਾਬ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ", "ਲੁਧਿਆਣਾ ਨਿਰਮਾਤਾ", "ਥੋਕ ਵਿਕਰੇਤਾ ਪੰਜਾਬ",
    "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ ਨਿਰਮਾਤਾ", "ਸਪਲਾਇਰ ਪੰਜਾਬ", "ਵਪਾਰੀ ਪੰਜਾਬ",
    "ਕਾਰੋਬਾਰ ਲਿਸਟਿੰਗ", "ਉਦਯੋਗਿਕ ਉਤਪਾਦ", "B2B ਮਾਰਕੀਟਪਲੇਸ ਇੰਡੀਆ",
    "business directory Punjab Punjabi", "Ludhiana manufacturers"
  ],
  alternates: { canonical, languages: { "en-IN": siteConfig.url, "hi-IN": `${siteConfig.url}/hi`, "pa-IN": canonical, "x-default": siteConfig.url } },
  openGraph: { type: "website", locale: "pa_IN", url: canonical, title: "ਪੰਜਾਬ ਦੀ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ | Twimzi", description: "ਪੰਜਾਬ ਦੇ ਕਾਰੋਬਾਰ, ਨਿਰਮਾਤਾ ਅਤੇ ਸਪਲਾਇਰ ਲੱਭੋ।" },
};

const groups = [
  { title: "ਨਿਰਮਾਤਾ ਅਤੇ ਫੈਕਟਰੀਆਂ", description: "ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਨਿਰਮਾਤਾਵਾਂ ਅਤੇ ਉਤਪਾਦਨ ਇਕਾਈਆਂ ਦੀ ਜਾਣਕਾਰੀ ਲੱਭੋ।", href: "/businesses/category/manufacturers", terms: "ਨਿਰਮਾਤਾ, ਫੈਕਟਰੀ, ਮੈਨੂਫੈਕਚਰਰ" },
  { title: "ਥੋਕ ਵਿਕਰੇਤਾ ਅਤੇ ਸਪਲਾਇਰ", description: "ਥੋਕ ਵਪਾਰੀਆਂ, ਡਿਸਟ੍ਰੀਬਿਊਟਰਾਂ ਅਤੇ ਸਪਲਾਇਰਾਂ ਨਾਲ ਜੁੜੋ।", href: "/businesses/category/wholesalers", terms: "ਥੋਕ ਵਿਕਰੇਤਾ, ਡਿਸਟ੍ਰੀਬਿਊਟਰ, ਸਪਲਾਇਰ" },
  { title: "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ", description: "ਖੇਤੀਬਾੜੀ ਸੰਦਾਂ, ਮਸ਼ੀਨਰੀ ਅਤੇ ਸਪੇਅਰ ਪਾਰਟਸ ਨਾਲ ਜੁੜੇ ਕਾਰੋਬਾਰ ਲੱਭੋ।", href: "/businesses", terms: "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ, ਖੇਤੀ ਸੰਦ, ਸਪੇਅਰ ਪਾਰਟਸ" },
  { title: "ਉਤਪਾਦ ਅਤੇ ਸੇਵਾਵਾਂ", description: "ਵੱਖ-ਵੱਖ ਉਦਯੋਗਾਂ ਦੇ ਉਤਪਾਦ, ਸੇਵਾਵਾਂ ਅਤੇ ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲ ਵੇਖੋ।", href: "/products", terms: "ਥੋਕ ਉਤਪਾਦ, ਉਦਯੋਗਿਕ ਉਤਪਾਦ, ਕਾਰੋਬਾਰੀ ਸੇਵਾਵਾਂ" },
];

export default function PunjabiLandingPage() {
  return (
    <main lang="pa" className="mx-auto min-h-screen w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <nav aria-label="ਭਾਸ਼ਾ ਚੁਣੋ" className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/" hrefLang="en-IN" className="rounded-full border px-4 py-2">English</Link>
        <Link href="/hi" hrefLang="hi-IN" className="rounded-full border px-4 py-2">हिन्दी</Link>
        <span aria-current="page" className="rounded-full bg-[#E8F7F4] px-4 py-2 font-semibold text-[#0D9488]">ਪੰਜਾਬੀ</span>
      </nav>
      <header className="max-w-4xl">
        <p className="text-sm font-bold tracking-wide text-[#0D9488]">ਪੰਜਾਬ ਦਾ ਕਾਰੋਬਾਰੀ ਨੈੱਟਵਰਕ</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14243D] sm:text-5xl">ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਕਾਰੋਬਾਰ, ਨਿਰਮਾਤਾ ਅਤੇ ਥੋਕ ਸਪਲਾਇਰ ਲੱਭੋ</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Twimzi ਇੱਕ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ ਅਤੇ B2B ਪਲੇਟਫਾਰਮ ਹੈ, ਜਿੱਥੇ ਤੁਸੀਂ ਕੰਪਨੀਆਂ, ਨਿਰਮਾਤਾਵਾਂ, ਥੋਕ ਵਿਕਰੇਤਾਵਾਂ, ਵਪਾਰੀਆਂ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ ਲੱਭ ਸਕਦੇ ਹੋ। ਕਾਰੋਬਾਰਾਂ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰੋ ਅਤੇ ਨਵੇਂ ਵਪਾਰਕ ਮੌਕੇ ਖੋਜੋ।</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/businesses" className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white">ਕਾਰੋਬਾਰ ਲੱਭੋ</Link>
          <Link href="/add-business" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-[#14243D]">ਆਪਣਾ ਕਾਰੋਬਾਰ ਜੋੜੋ</Link>
        </div>
      </header>
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-[#14243D]">ਕਾਰੋਬਾਰ ਦੀਆਂ ਸ਼੍ਰੇਣੀਆਂ ਵੇਖੋ</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {groups.map((group) => <article key={group.title} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[#14243D]">{group.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            <p className="mt-3 text-xs text-slate-500">ਸੰਬੰਧਿਤ ਖੋਜ: {group.terms}</p>
            <Link href={group.href} className="mt-4 inline-flex font-semibold text-[#0D9488]">ਹੋਰ ਵੇਖੋ →</Link>
          </article>)}
        </div>
      </section>
      <section className="mt-14 rounded-2xl bg-[#F6F8FA] p-7">
        <h2 className="text-2xl font-bold text-[#14243D]">Twimzi ’ਤੇ ਆਪਣਾ ਕਾਰੋਬਾਰ ਦਰਜ ਕਰੋ</h2>
        <p className="mt-3 leading-7 text-slate-600">ਆਪਣੀ ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕਰੋ ਅਤੇ ਸੰਭਾਵੀ ਗਾਹਕਾਂ ਅਤੇ ਵਪਾਰਕ ਖਰੀਦਦਾਰਾਂ ਤੱਕ ਪਹੁੰਚੋ।</p>
        <Link href="/add-business" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-5 py-3 font-bold text-white">ਮੁਫ਼ਤ ਕਾਰੋਬਾਰੀ ਲਿਸਟਿੰਗ</Link>
      </section>
      <p className="mt-10 text-sm text-slate-500">Twimzi ’ਤੇ ਪੰਜਾਬੀ ਵਿੱਚ ਕਾਰੋਬਾਰ ਲੱਭੋ। ਉਪਲਬਧ ਲਿਸਟਿੰਗ ਅਤੇ ਜਾਣਕਾਰੀ ਸੰਬੰਧਿਤ ਕਾਰੋਬਾਰਾਂ ਵੱਲੋਂ ਸਾਂਝੀ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।</p>
    </main>
  );
}
