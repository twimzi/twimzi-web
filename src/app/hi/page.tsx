import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

const canonical = `${siteConfig.url}/hi`;

export const metadata: Metadata = {
  title: "भारत का बिज़नेस डायरेक्टरी और B2B मार्केटप्लेस | Twimzi",
  description: "Twimzi पर भारत के निर्माता, थोक विक्रेता, सप्लायर, ट्रेडर्स और स्थानीय व्यवसाय खोजें। कंपनियों, उत्पादों और सेवाओं की जानकारी पाएं और सीधे संपर्क करें।",
  keywords: [
    "बिज़नेस डायरेक्टरी", "भारत में थोक सप्लायर", "निर्माता", "मैन्युफैक्चरर्स इन इंडिया",
    "थोक विक्रेता", "सप्लायर", "व्यापार", "B2B मार्केटप्लेस इंडिया",
    "लुधियाना में निर्माता", "कृषि मशीनरी निर्माता", "व्यापारियों की सूची",
    "business directory India Hindi", "wholesale suppliers India"
  ],
  alternates: { canonical, languages: { "en-IN": siteConfig.url, "hi-IN": canonical, "pa-IN": `${siteConfig.url}/pa`, "x-default": siteConfig.url } },
  openGraph: { type: "website", locale: "hi_IN", url: canonical, title: "भारत का बिज़नेस डायरेक्टरी | Twimzi", description: "भारत के व्यवसाय, निर्माता और सप्लायर हिंदी में खोजें।" },
};

const groups = [
  { title: "निर्माता और फैक्ट्रियां", description: "भारत के मैन्युफैक्चरर्स और उत्पादन कंपनियों की जानकारी खोजें।", href: "/businesses/category/manufacturers", terms: "निर्माता, फैक्ट्री, मैन्युफैक्चरर्स" },
  { title: "थोक विक्रेता और सप्लायर", description: "थोक व्यापारियों, डिस्ट्रीब्यूटर्स और सप्लायर्स से जुड़ें।", href: "/businesses/category/wholesalers", terms: "थोक विक्रेता, डिस्ट्रीब्यूटर, सप्लायर" },
  { title: "कृषि मशीनरी", description: "कृषि उपकरण, मशीनरी और स्पेयर पार्ट्स से जुड़े व्यवसाय खोजें।", href: "/businesses", terms: "कृषि मशीनरी, कृषि उपकरण, स्पेयर पार्ट्स" },
  { title: "उत्पाद और सेवाएं", description: "विभिन्न उद्योगों के उत्पाद, सेवाएं और व्यावसायिक प्रोफाइल देखें।", href: "/products", terms: "थोक उत्पाद, औद्योगिक उत्पाद, व्यावसायिक सेवाएं" },
];

export default function HindiLandingPage() {
  return (
    <main lang="hi" className="mx-auto min-h-screen w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <nav aria-label="भाषा चुनें" className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/" hrefLang="en-IN" className="rounded-full border px-4 py-2">English</Link>
        <span aria-current="page" className="rounded-full bg-[#E8F7F4] px-4 py-2 font-semibold text-[#0D9488]">हिन्दी</span>
        <Link href="/pa" hrefLang="pa-IN" className="rounded-full border px-4 py-2">ਪੰਜਾਬੀ</Link>
      </nav>
      <header className="max-w-4xl">
        <p className="text-sm font-bold tracking-wide text-[#0D9488]">भारत का बिज़नेस नेटवर्क</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14243D] sm:text-5xl">भारत के व्यवसाय, निर्माता और थोक सप्लायर खोजें</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Twimzi एक बिज़नेस डायरेक्टरी और B2B प्लेटफॉर्म है, जहां आप कंपनियों, निर्माताओं, थोक विक्रेताओं, ट्रेडर्स, उत्पादों और सेवाओं की जानकारी खोज सकते हैं। व्यवसायों से सीधे संपर्क करें और नए व्यावसायिक अवसर तलाशें।</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/businesses" className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white">व्यवसाय खोजें</Link>
          <Link href="/add-business" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-[#14243D]">अपना व्यवसाय जोड़ें</Link>
        </div>
      </header>
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-[#14243D]">व्यवसाय की श्रेणियां खोजें</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {groups.map((group) => <article key={group.title} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[#14243D]">{group.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            <p className="mt-3 text-xs text-slate-500">संबंधित खोज: {group.terms}</p>
            <Link href={group.href} className="mt-4 inline-flex font-semibold text-[#0D9488]">और देखें →</Link>
          </article>)}
        </div>
      </section>
      <section className="mt-14 rounded-2xl bg-[#F6F8FA] p-7">
        <h2 className="text-2xl font-bold text-[#14243D]">Twimzi पर अपना व्यवसाय सूचीबद्ध करें</h2>
        <p className="mt-3 leading-7 text-slate-600">अपने व्यवसाय की प्रोफाइल बनाएं, उत्पादों और सेवाओं की जानकारी साझा करें और संभावित ग्राहकों तथा व्यावसायिक खरीदारों तक पहुंचें।</p>
        <Link href="/add-business" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-5 py-3 font-bold text-white">मुफ़्त बिज़नेस लिस्टिंग</Link>
      </section>
      <p className="mt-10 text-sm text-slate-500">Twimzi पर हिंदी में व्यवसाय खोजें। उपलब्ध लिस्टिंग और जानकारी संबंधित व्यवसायों द्वारा साझा की जाती है।</p>
    </main>
  );
}
