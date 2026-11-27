import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/seo/structured-data";

const canonical = `${siteConfig.url}/pa`;
const title = "ਪੰਜਾਬ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ: ਨਿਰਮਾਤਾ, ਥੋਕ ਵਿਕਰੇਤਾ ਅਤੇ ਸਪਲਾਇਰ | Twimzi";
const description = "ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਨਿਰਮਾਤਾ, ਫੈਕਟਰੀਆਂ, ਥੋਕ ਵਿਕਰੇਤਾ, ਸਪਲਾਇਰ ਅਤੇ ਸਥਾਨਕ ਕਾਰੋਬਾਰ Twimzi ’ਤੇ ਲੱਭੋ। ਉਤਪਾਦ, ਸੇਵਾਵਾਂ ਅਤੇ ਕਾਰੋਬਾਰੀ ਜਾਣਕਾਰੀ ਵੇਖੋ ਅਤੇ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰੋ।";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "ਪੰਜਾਬ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ", "ਪੰਜਾਬ ਦੇ ਨਿਰਮਾਤਾ", "ਲੁਧਿਆਣਾ ਨਿਰਮਾਤਾ",
    "ਪੰਜਾਬ ਥੋਕ ਵਿਕਰੇਤਾ", "ਪੰਜਾਬ ਸਪਲਾਇਰ", "ਪੰਜਾਬ ਫੈਕਟਰੀਆਂ",
    "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ ਪੰਜਾਬ", "ਉਦਯੋਗਿਕ ਸਪੇਅਰ ਪਾਰਟਸ", "B2B ਮਾਰਕੀਟਪਲੇਸ ਪੰਜਾਬ",
    "ਕਾਰੋਬਾਰ ਲਿਸਟਿੰਗ ਪੰਜਾਬ", "ਪੰਜਾਬ ਦੇ ਵਪਾਰੀ", "Punjabi business directory",
    "manufacturers in Punjab", "wholesale suppliers Punjab"
  ],
  alternates: {
    canonical,
    languages: {
      "en-IN": siteConfig.url,
      "hi-IN": `${siteConfig.url}/hi`,
      "pa-IN": canonical,
      "x-default": siteConfig.url,
    },
  },
  openGraph: {
    type: "website",
    locale: "pa_IN",
    url: canonical,
    siteName: siteConfig.name,
    title,
    description,
    images: [{ url: "/twimzi-logo.png", width: 1200, height: 630, alt: "Twimzi ਪੰਜਾਬ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twimzi-logo.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

const categories = [
  { name: "ਨਿਰਮਾਤਾ ਅਤੇ ਫੈਕਟਰੀਆਂ", description: "ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੀਆਂ ਮੈਨੂਫੈਕਚਰਿੰਗ ਕੰਪਨੀਆਂ, ਉਤਪਾਦਨ ਇਕਾਈਆਂ ਅਤੇ ਫੈਕਟਰੀਆਂ ਦੀਆਂ ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲਾਂ ਲੱਭੋ।", href: "/businesses/category/manufacturers", keywords: "ਨਿਰਮਾਤਾ, ਫੈਕਟਰੀ, ਮੈਨੂਫੈਕਚਰਰ" },
  { name: "ਥੋਕ ਵਿਕਰੇਤਾ ਅਤੇ ਸਪਲਾਇਰ", description: "ਥੋਕ ਵਪਾਰੀਆਂ, ਡਿਸਟ੍ਰੀਬਿਊਟਰਾਂ ਅਤੇ ਵੱਖ-ਵੱਖ ਉਦਯੋਗਾਂ ਦੇ ਸਪਲਾਇਰਾਂ ਨਾਲ ਜੁੜੋ।", href: "/businesses/category/wholesalers", keywords: "ਥੋਕ ਵਿਕਰੇਤਾ, ਡਿਸਟ੍ਰੀਬਿਊਟਰ, ਸਪਲਾਇਰ" },
  { name: "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ ਅਤੇ ਪੁਰਜ਼ੇ", description: "ਖੇਤੀਬਾੜੀ ਸੰਦਾਂ, ਮਸ਼ੀਨਰੀ, ਰੋਟਾਵੇਟਰ ਬਲੇਡਾਂ ਅਤੇ ਸਪੇਅਰ ਪਾਰਟਸ ਨਾਲ ਸੰਬੰਧਿਤ ਕਾਰੋਬਾਰ ਖੋਜੋ।", href: "/businesses", keywords: "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ, ਖੇਤੀ ਸੰਦ, ਸਪੇਅਰ ਪਾਰਟਸ" },
  { name: "ਉਤਪਾਦ ਅਤੇ ਵਪਾਰਕ ਸਮਾਨ", description: "ਵੱਖ-ਵੱਖ ਕਾਰੋਬਾਰਾਂ ਵੱਲੋਂ ਸਾਂਝੇ ਕੀਤੇ ਉਤਪਾਦ ਅਤੇ ਉਦਯੋਗਿਕ ਸਮਾਨ ਵੇਖੋ।", href: "/products", keywords: "ਥੋਕ ਉਤਪਾਦ, ਉਦਯੋਗਿਕ ਉਤਪਾਦ, ਵਪਾਰਕ ਸਮਾਨ" },
  { name: "ਸੇਵਾਵਾਂ ਅਤੇ ਪੇਸ਼ੇਵਰ", description: "ਕਾਰੋਬਾਰਾਂ ਅਤੇ ਪੇਸ਼ੇਵਰ ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਖੋਜੋ।", href: "/services", keywords: "ਕਾਰੋਬਾਰੀ ਸੇਵਾਵਾਂ, ਪੇਸ਼ੇਵਰ, ਸੇਵਾ ਪ੍ਰਦਾਤਾ" },
  { name: "ਕਾਰੋਬਾਰੀ ਆਫ਼ਰ", description: "Twimzi ’ਤੇ ਪ੍ਰਕਾਸ਼ਿਤ ਕਾਰੋਬਾਰੀ ਆਫ਼ਰ ਅਤੇ ਪ੍ਰਚਾਰ ਸੰਬੰਧੀ ਜਾਣਕਾਰੀ ਵੇਖੋ।", href: "/offers", keywords: "ਕਾਰੋਬਾਰੀ ਆਫ਼ਰ, ਵਪਾਰਕ ਪੇਸ਼ਕਸ਼ਾਂ" },
];

const faqs = [
  { question: "Twimzi ਕੀ ਹੈ?", answer: "Twimzi ਇੱਕ ਡਿਜ਼ਿਟਲ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ ਅਤੇ B2B ਖੋਜ ਪਲੇਟਫਾਰਮ ਹੈ। ਇੱਥੇ ਲੋਕ ਕਾਰੋਬਾਰਾਂ, ਨਿਰਮਾਤਾਵਾਂ, ਥੋਕ ਵਿਕਰੇਤਾਵਾਂ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਲੱਭ ਸਕਦੇ ਹਨ।" },
  { question: "ਮੈਂ ਪੰਜਾਬ ਵਿੱਚ ਨਿਰਮਾਤਾ ਜਾਂ ਥੋਕ ਸਪਲਾਇਰ ਕਿਵੇਂ ਲੱਭ ਸਕਦਾ ਹਾਂ?", answer: "ਕਾਰੋਬਾਰਾਂ ਵਾਲੇ ਪੰਨੇ ਤੋਂ ਖੋਜ ਸ਼ੁਰੂ ਕਰੋ ਜਾਂ ਨਿਰਮਾਤਾ ਅਤੇ ਥੋਕ ਵਿਕਰੇਤਾ ਸ਼੍ਰੇਣੀਆਂ ਖੋਲ੍ਹੋ। ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲ ਵਿੱਚ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਦੇ ਆਧਾਰ 'ਤੇ ਉਚਿਤ ਕਾਰੋਬਾਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।" },
  { question: "ਕੀ ਮੈਂ ਆਪਣਾ ਕਾਰੋਬਾਰ Twimzi ’ਤੇ ਜੋੜ ਸਕਦਾ ਹਾਂ?", answer: "ਹਾਂ। ਆਪਣਾ ਕਾਰੋਬਾਰ ਜੋੜੋ ਪੰਨਾ ਖੋਲ੍ਹ ਕੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪ੍ਰਕਿਰਿਆ ਪੂਰੀ ਕਰੋ ਅਤੇ ਆਪਣੇ ਕਾਰੋਬਾਰ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਦੀ ਸਹੀ ਜਾਣਕਾਰੀ ਦਿਓ।" },
  { question: "ਕੀ Twimzi ਸਿਰਫ਼ ਲੁਧਿਆਣਾ ਜਾਂ ਪੰਜਾਬ ਲਈ ਹੈ?", answer: "ਨਹੀਂ। ਪੰਜਾਬ ਤੋਂ ਸ਼ੁਰੂ ਕਰਦੇ ਹੋਏ Twimzi ਭਾਰਤ ਭਰ ਦੇ ਕਾਰੋਬਾਰਾਂ ਅਤੇ ਖਰੀਦਦਾਰਾਂ ਲਈ ਕਾਰੋਬਾਰੀ ਖੋਜ ਅਤੇ ਜਾਣਕਾਰੀ ਦਾ ਪਲੇਟਫਾਰਮ ਹੈ। ਉਪਲਬਧ ਲਿਸਟਿੰਗ ਸ਼ਹਿਰ ਅਤੇ ਕਾਰੋਬਾਰੀ ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਬਦਲ ਸਕਦੀਆਂ ਹਨ।" },
  { question: "ਕੀ Twimzi ਉਤਪਾਦਾਂ ਦੀ ਗੁਣਵੱਤਾ ਜਾਂ ਸਪਲਾਇਰ ਦੀ ਗਾਰੰਟੀ ਦਿੰਦਾ ਹੈ?", answer: "ਕਾਰੋਬਾਰੀ ਲਿਸਟਿੰਗ ਅਤੇ ਉਤਪਾਦਾਂ ਦੀ ਜਾਣਕਾਰੀ ਸੰਬੰਧਿਤ ਕਾਰੋਬਾਰਾਂ ਵੱਲੋਂ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ। ਆਰਡਰ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਖਰੀਦਦਾਰ ਨੂੰ ਸਪਲਾਇਰ, ਕੀਮਤ, ਗੁਣਵੱਤਾ, ਭੁਗਤਾਨ ਅਤੇ ਡਿਲਿਵਰੀ ਦੀਆਂ ਸ਼ਰਤਾਂ ਖੁਦ ਜਾਂਚਣੀਆਂ ਚਾਹੀਦੀਆਂ ਹਨ।" },
  { question: "ਕੀ Twimzi ’ਤੇ ਕਾਰੋਬਾਰੀ ਜਾਣਕਾਰੀ ਮੁਫ਼ਤ ਵੇਖੀ ਜਾ ਸਕਦੀ ਹੈ?", answer: "ਜਨਤਕ ਤੌਰ ’ਤੇ ਉਪਲਬਧ ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲਾਂ ਅਤੇ ਜਾਣਕਾਰੀ ਨੂੰ ਵੈੱਬਸਾਈਟ 'ਤੇ ਵੇਖਿਆ ਜਾ ਸਕਦਾ ਹੈ। ਕਿਸੇ ਖਾਸ ਸੇਵਾ ਜਾਂ ਫੀਚਰ ਦੀਆਂ ਸ਼ਰਤਾਂ ਲਈ ਸੰਬੰਧਿਤ ਪੰਨੇ ਦੀ ਜਾਣਕਾਰੀ ਵੇਖੋ।" },
];

const pageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      inLanguage: "pa-IN",
      isPartOf: { "@id": `${siteConfig.url}/#website` },
      about: { "@id": `${siteConfig.url}/#organization` },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      mainEntity: { "@id": `${canonical}#categories` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ਮੁੱਖ ਪੰਨਾ", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "ਪੰਜਾਬੀ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ", item: canonical },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${canonical}#categories`,
      name: "Twimzi ’ਤੇ ਕਾਰੋਬਾਰੀ ਸ਼੍ਰੇਣੀਆਂ",
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.name,
        url: `${siteConfig.url}${category.href}`,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function PunjabiLandingPage() {
  return (
    <main lang="pa" className="mx-auto min-h-screen w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <StructuredData data={pageSchema} />
      <nav aria-label="ਭਾਸ਼ਾ ਚੁਣੋ" className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/" hrefLang="en-IN" className="rounded-full border px-4 py-2">English</Link>
        <Link href="/hi" hrefLang="hi-IN" className="rounded-full border px-4 py-2">हिन्दी</Link>
        <span aria-current="page" className="rounded-full bg-[#E8F7F4] px-4 py-2 font-semibold text-[#0D9488]">ਪੰਜਾਬੀ</span>
      </nav>

      <header className="max-w-4xl">
        <p className="text-sm font-bold tracking-wide text-[#0D9488]">ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦਾ ਕਾਰੋਬਾਰੀ ਨੈੱਟਵਰਕ</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14243D] sm:text-5xl">ਪੰਜਾਬ ਅਤੇ ਭਾਰਤ ਦੇ ਨਿਰਮਾਤਾ, ਥੋਕ ਵਿਕਰੇਤਾ ਅਤੇ ਸਪਲਾਇਰ ਲੱਭੋ</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Twimzi ਇੱਕ ਡਿਜ਼ਿਟਲ ਬਿਜ਼ਨਸ ਡਾਇਰੈਕਟਰੀ ਅਤੇ B2B ਖੋਜ ਪਲੇਟਫਾਰਮ ਹੈ। ਇੱਥੇ ਤੁਸੀਂ ਲੁਧਿਆਣਾ, ਜਲੰਧਰ, ਅੰਮ੍ਰਿਤਸਰ, ਮੋਹਾਲੀ, ਪਟਿਆਲਾ ਅਤੇ ਭਾਰਤ ਦੇ ਹੋਰ ਸ਼ਹਿਰਾਂ ਦੇ ਕਾਰੋਬਾਰਾਂ ਦੀਆਂ ਉਪਲਬਧ ਪ੍ਰੋਫਾਈਲਾਂ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਖੋਜ ਸਕਦੇ ਹੋ। ਨਿਰਮਾਤਾਵਾਂ, ਫੈਕਟਰੀਆਂ, ਥੋਕ ਵਪਾਰੀਆਂ, ਡਿਸਟ੍ਰੀਬਿਊਟਰਾਂ ਅਤੇ ਸਥਾਨਕ ਸੇਵਾ ਪ੍ਰਦਾਤਾਵਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ ਵੇਖੋ ਅਤੇ ਉਨ੍ਹਾਂ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰਨ ਦੇ ਵਿਕਲਪ ਲੱਭੋ।</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/businesses" className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white">ਕਾਰੋਬਾਰ ਲੱਭੋ</Link>
          <Link href="/add-business" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-[#14243D]">ਆਪਣਾ ਕਾਰੋਬਾਰ ਜੋੜੋ</Link>
        </div>
      </header>

      <section className="mt-14" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-2xl font-bold text-[#14243D]">ਕਾਰੋਬਾਰ ਦੀਆਂ ਸ਼੍ਰੇਣੀਆਂ ਵੇਖੋ</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">ਆਪਣੀ ਲੋੜ ਅਨੁਸਾਰ ਨਿਰਮਾਤਾ, ਥੋਕ ਸਪਲਾਇਰ, ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ, ਉਤਪਾਦਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਨਾਲ ਸੰਬੰਧਿਤ ਕਾਰੋਬਾਰੀ ਜਾਣਕਾਰੀ ਖੋਜੋ।</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.name} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-[#14243D]">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              <p className="mt-3 text-xs text-slate-500">ਸੰਬੰਧਿਤ ਖੋਜ: {category.keywords}</p>
              <Link href={category.href} className="mt-4 inline-flex font-semibold text-[#0D9488]">ਕਾਰੋਬਾਰ ਵੇਖੋ →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 rounded-2xl bg-[#F6F8FA] p-7 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-[#14243D]">ਖਰੀਦਦਾਰਾਂ ਅਤੇ ਕਾਰੋਬਾਰਾਂ ਲਈ ਇੱਕ ਥਾਂ</h2>
          <p className="mt-3 leading-7 text-slate-600">ਖਰੀਦਦਾਰ ਕਾਰੋਬਾਰੀ ਪ੍ਰੋਫਾਈਲਾਂ ਅਤੇ ਉਪਲਬਧ ਉਤਪਾਦ ਜਾਣਕਾਰੀ ਦੀ ਤੁਲਨਾ ਕਰ ਸਕਦੇ ਹਨ। ਨਿਰਮਾਤਾ, ਵਪਾਰੀ ਅਤੇ ਸੇਵਾ ਪ੍ਰਦਾਤਾ ਆਪਣੀ ਡਿਜ਼ਿਟਲ ਮੌਜੂਦਗੀ ਬਣਾਉਣ ਅਤੇ ਸੰਭਾਵੀ ਗਾਹਕਾਂ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਆਪਣੀ ਲਿਸਟਿੰਗ ਜੋੜ ਸਕਦੇ ਹਨ।</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#14243D]">ਆਪਣੇ ਕਾਰੋਬਾਰ ਨੂੰ Twimzi ’ਤੇ ਦਰਜ ਕਰੋ</h2>
          <p className="mt-3 leading-7 text-slate-600">ਆਪਣੀ ਕੰਪਨੀ ਦਾ ਨਾਮ, ਕਾਰੋਬਾਰੀ ਸ਼੍ਰੇਣੀ, ਸਥਾਨ, ਸੰਪਰਕ ਵੇਰਵੇ ਅਤੇ ਉਪਲਬਧ ਉਤਪਾਦਾਂ ਜਾਂ ਸੇਵਾਵਾਂ ਦੀ ਸਹੀ ਜਾਣਕਾਰੀ ਦਿਓ। ਪੂਰੀ ਅਤੇ ਅੱਪਡੇਟ ਪ੍ਰੋਫਾਈਲ ਗਾਹਕਾਂ ਨੂੰ ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਨੂੰ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ।</p>
          <Link href="/add-business" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-5 py-3 font-bold text-white">ਮੁਫ਼ਤ ਕਾਰੋਬਾਰੀ ਲਿਸਟਿੰਗ ਸ਼ੁਰੂ ਕਰੋ</Link>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-bold text-[#14243D]">Twimzi ’ਤੇ ਕਾਰੋਬਾਰ ਕਿਵੇਂ ਲੱਭੀਏ?</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          <li className="rounded-xl border p-5"><h3 className="font-bold">1. ਸ਼੍ਰੇਣੀ ਚੁਣੋ</h3><p className="mt-2 text-sm leading-6 text-slate-600">ਨਿਰਮਾਤਾ, ਥੋਕ ਵਿਕਰੇਤਾ, ਉਤਪਾਦ ਜਾਂ ਸੇਵਾਵਾਂ ਵਿੱਚੋਂ ਆਪਣੀ ਲੋੜ ਚੁਣੋ।</p></li>
          <li className="rounded-xl border p-5"><h3 className="font-bold">2. ਪ੍ਰੋਫਾਈਲ ਵੇਖੋ</h3><p className="mt-2 text-sm leading-6 text-slate-600">ਉਪਲਬਧ ਕਾਰੋਬਾਰੀ ਵੇਰਵੇ, ਸਥਾਨ ਅਤੇ ਉਤਪਾਦ ਜਾਂ ਸੇਵਾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਪੜ੍ਹੋ।</p></li>
          <li className="rounded-xl border p-5"><h3 className="font-bold">3. ਜਾਂਚ ਕੇ ਸੰਪਰਕ ਕਰੋ</h3><p className="mt-2 text-sm leading-6 text-slate-600">ਕਾਰੋਬਾਰ ਨਾਲ ਸੰਪਰਕ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਲੋੜੀਂਦੇ ਵੇਰਵੇ ਅਤੇ ਵਪਾਰਕ ਸ਼ਰਤਾਂ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।</p></li>
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold text-[#14243D]">ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ</h2>
        <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-5">
          {faqs.map((faq) => (
            <article key={faq.question} className="py-5">
              <h3 className="font-bold text-[#14243D]">{faq.question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <nav aria-label="ਹੋਰ ਜਾਣਕਾਰੀ" className="mt-12 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#0D9488]">
        <Link href="/about">Twimzi ਬਾਰੇ</Link>
        <Link href="/contact">ਸੰਪਰਕ ਕਰੋ</Link>
        <Link href="/blog">ਕਾਰੋਬਾਰੀ ਬਲੌਗ</Link>
        <Link href="/news">ਕਾਰੋਬਾਰੀ ਖ਼ਬਰਾਂ</Link>
        <Link href="/free-business-listing-india">ਮੁਫ਼ਤ ਬਿਜ਼ਨਸ ਲਿਸਟਿੰਗ</Link>
      </nav>
      <p className="mt-8 text-sm leading-6 text-slate-500">ਨੋਟ: ਕਾਰੋਬਾਰੀ ਲਿਸਟਿੰਗ ਅਤੇ ਉਤਪਾਦਾਂ ਜਾਂ ਸੇਵਾਵਾਂ ਦੇ ਵੇਰਵੇ ਸੰਬੰਧਿਤ ਕਾਰੋਬਾਰਾਂ ਵੱਲੋਂ ਸਾਂਝੇ ਕੀਤੇ ਜਾਂਦੇ ਹਨ। ਕਿਸੇ ਵੀ ਖਰੀਦ ਜਾਂ ਵਪਾਰਕ ਸਮਝੌਤੇ ਤੋਂ ਪਹਿਲਾਂ ਪਛਾਣ, ਗੁਣਵੱਤਾ, ਕੀਮਤ, ਭੁਗਤਾਨ ਅਤੇ ਡਿਲਿਵਰੀ ਦੀਆਂ ਸ਼ਰਤਾਂ ਦੀ ਸੁਤੰਤਰ ਤੌਰ ’ਤੇ ਜਾਂਚ ਕਰੋ।</p>
    </main>
  );
}
