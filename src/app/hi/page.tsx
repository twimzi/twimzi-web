import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/seo/structured-data";

const canonical = `${siteConfig.url}/hi`;
const title = "भारत बिज़नेस डायरेक्टरी: निर्माता, थोक विक्रेता और सप्लायर | Twimzi";
const description = "भारत के निर्माता, फैक्ट्रियां, थोक विक्रेता, सप्लायर और स्थानीय व्यवसाय Twimzi पर खोजें। उत्पादों, सेवाओं और व्यावसायिक प्रोफाइल की जानकारी देखें और सीधे संपर्क करें।";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "भारत बिज़नेस डायरेक्टरी", "भारत में निर्माता", "भारत में थोक सप्लायर",
    "थोक विक्रेता", "फैक्ट्री और मैन्युफैक्चरर्स", "लुधियाना निर्माता",
    "पंजाब बिज़नेस डायरेक्टरी", "कृषि मशीनरी निर्माता", "औद्योगिक स्पेयर पार्ट्स",
    "B2B मार्केटप्लेस इंडिया", "व्यापारियों की सूची", "फ्री बिज़नेस लिस्टिंग",
    "Hindi business directory India", "wholesale suppliers India"
  ],
  alternates: {
    canonical,
    languages: {
      "en-IN": siteConfig.url,
      "hi-IN": canonical,
      "pa-IN": `${siteConfig.url}/pa`,
      "x-default": siteConfig.url,
    },
  },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    url: canonical,
    siteName: siteConfig.name,
    title,
    description,
    images: [{ url: "/twimzi-logo.png", width: 1200, height: 630, alt: "Twimzi भारत बिज़नेस डायरेक्टरी" }],
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
  { name: "निर्माता और फैक्ट्रियां", description: "भारत की मैन्युफैक्चरिंग कंपनियों, उत्पादन इकाइयों और फैक्ट्रियों की व्यावसायिक प्रोफाइल खोजें।", href: "/businesses/category/manufacturers", keywords: "निर्माता, फैक्ट्री, मैन्युफैक्चरर्स" },
  { name: "थोक विक्रेता और सप्लायर", description: "थोक व्यापारियों, डिस्ट्रीब्यूटर्स और विभिन्न उद्योगों के सप्लायर्स से जुड़ें।", href: "/businesses/category/wholesalers", keywords: "थोक विक्रेता, डिस्ट्रीब्यूटर, सप्लायर" },
  { name: "कृषि मशीनरी और पुर्जे", description: "कृषि उपकरण, मशीनरी, रोटावेटर ब्लेड और स्पेयर पार्ट्स से जुड़े व्यवसाय खोजें।", href: "/businesses", keywords: "कृषि मशीनरी, कृषि उपकरण, स्पेयर पार्ट्स" },
  { name: "उत्पाद और व्यापारिक सामान", description: "विभिन्न व्यवसायों द्वारा साझा किए गए उत्पादों और औद्योगिक सामान की जानकारी देखें।", href: "/products", keywords: "थोक उत्पाद, औद्योगिक उत्पाद, व्यापारिक सामान" },
  { name: "सेवाएं और पेशेवर", description: "व्यवसायों और पेशेवर सेवा प्रदाताओं की जानकारी खोजें।", href: "/services", keywords: "व्यावसायिक सेवाएं, पेशेवर, सेवा प्रदाता" },
  { name: "व्यावसायिक ऑफर", description: "Twimzi पर प्रकाशित व्यावसायिक ऑफर और प्रचार संबंधी जानकारी देखें।", href: "/offers", keywords: "बिज़नेस ऑफर, व्यापारिक प्रस्ताव" },
];

const faqs = [
  { question: "Twimzi क्या है?", answer: "Twimzi एक डिजिटल बिज़नेस डायरेक्टरी और B2B खोज प्लेटफॉर्म है। यहां लोग व्यवसायों, निर्माताओं, थोक विक्रेताओं, उत्पादों और सेवाओं की जानकारी खोज सकते हैं।" },
  { question: "मैं भारत में निर्माता या थोक सप्लायर कैसे खोज सकता हूं?", answer: "व्यवसाय खोजें पेज से शुरुआत करें या निर्माता और थोक विक्रेता श्रेणियां खोलें। संबंधित व्यवसाय की प्रोफाइल में उपलब्ध जानकारी देखें और आवश्यक विवरण की पुष्टि करके संपर्क करें।" },
  { question: "क्या मैं अपना व्यवसाय Twimzi पर जोड़ सकता हूं?", answer: "हां। अपना व्यवसाय जोड़ें पेज खोलें, रजिस्ट्रेशन प्रक्रिया पूरी करें और अपने व्यवसाय, उत्पादों तथा सेवाओं की सही और अपडेट जानकारी दें।" },
  { question: "क्या Twimzi केवल लुधियाना या पंजाब के लिए है?", answer: "नहीं। पंजाब से शुरुआत करते हुए Twimzi भारत भर के व्यवसायों और खरीदारों के लिए व्यावसायिक खोज और जानकारी का प्लेटफॉर्म है। उपलब्ध लिस्टिंग शहर और व्यवसाय श्रेणी के अनुसार अलग-अलग हो सकती हैं।" },
  { question: "क्या Twimzi उत्पादों की गुणवत्ता या सप्लायर की गारंटी देता है?", answer: "व्यवसाय की लिस्टिंग और उत्पादों की जानकारी संबंधित व्यवसायों द्वारा दी जाती है। ऑर्डर देने से पहले खरीदार को सप्लायर, कीमत, गुणवत्ता, भुगतान और डिलीवरी की शर्तों की स्वतंत्र रूप से जांच करनी चाहिए।" },
  { question: "क्या Twimzi पर व्यवसाय की जानकारी मुफ्त देख सकते हैं?", answer: "सार्वजनिक रूप से उपलब्ध व्यवसाय प्रोफाइल और जानकारी वेबसाइट पर देखी जा सकती है। किसी विशेष सेवा या फीचर की शर्तों के लिए संबंधित पेज पर दी गई जानकारी देखें।" },
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
      inLanguage: "hi-IN",
      isPartOf: { "@id": `${siteConfig.url}/#website` },
      about: { "@id": `${siteConfig.url}/#organization` },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      mainEntity: { "@id": `${canonical}#categories` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "होम", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "हिंदी बिज़नेस डायरेक्टरी", item: canonical },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${canonical}#categories`,
      name: "Twimzi पर व्यवसाय श्रेणियां",
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

export default function HindiLandingPage() {
  return (
    <main lang="hi" className="mx-auto min-h-screen w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <StructuredData data={pageSchema} />
      <nav aria-label="भाषा चुनें" className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="/" hrefLang="en-IN" className="rounded-full border px-4 py-2">English</Link>
        <span aria-current="page" className="rounded-full bg-[#E8F7F4] px-4 py-2 font-semibold text-[#0D9488]">हिन्दी</span>
        <Link href="/pa" hrefLang="pa-IN" className="rounded-full border px-4 py-2">ਪੰਜਾਬੀ</Link>
      </nav>

      <header className="max-w-4xl">
        <p className="text-sm font-bold tracking-wide text-[#0D9488]">भारत का बिज़नेस नेटवर्क</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14243D] sm:text-5xl">भारत के निर्माता, थोक विक्रेता और सप्लायर खोजें</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Twimzi एक डिजिटल बिज़नेस डायरेक्टरी और B2B खोज प्लेटफॉर्म है। यहां आप लुधियाना, जालंधर, अमृतसर, मोहाली, पटियाला और भारत के अन्य शहरों में उपलब्ध व्यवसायों की प्रोफाइल, उत्पादों और सेवाओं की जानकारी खोज सकते हैं। निर्माता, फैक्ट्रियां, थोक व्यापारी, डिस्ट्रीब्यूटर और स्थानीय सेवा प्रदाताओं के बारे में जानें और उनसे सीधे संपर्क करने के उपलब्ध विकल्प देखें।</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/businesses" className="rounded-xl bg-[#0D9488] px-5 py-3 font-bold text-white">व्यवसाय खोजें</Link>
          <Link href="/add-business" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-[#14243D]">अपना व्यवसाय जोड़ें</Link>
        </div>
      </header>

      <section className="mt-14" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-2xl font-bold text-[#14243D]">व्यवसाय की श्रेणियां खोजें</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">अपनी जरूरत के अनुसार निर्माता, थोक सप्लायर, कृषि मशीनरी, उत्पादों और सेवाओं से संबंधित व्यवसायों की जानकारी खोजें।</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.name} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-[#14243D]">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              <p className="mt-3 text-xs text-slate-500">संबंधित खोज: {category.keywords}</p>
              <Link href={category.href} className="mt-4 inline-flex font-semibold text-[#0D9488]">व्यवसाय देखें →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-8 rounded-2xl bg-[#F6F8FA] p-7 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-[#14243D]">खरीदारों और व्यवसायों के लिए एक जगह</h2>
          <p className="mt-3 leading-7 text-slate-600">खरीदार व्यवसाय प्रोफाइल और उपलब्ध उत्पाद जानकारी देख सकते हैं। निर्माता, व्यापारी और सेवा प्रदाता अपनी डिजिटल उपस्थिति बनाने और संभावित ग्राहकों तक पहुंचने के लिए अपनी लिस्टिंग जोड़ सकते हैं।</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#14243D]">Twimzi पर अपना व्यवसाय सूचीबद्ध करें</h2>
          <p className="mt-3 leading-7 text-slate-600">अपनी कंपनी का नाम, व्यवसाय श्रेणी, स्थान, संपर्क विवरण और उपलब्ध उत्पादों या सेवाओं की सही जानकारी दें। पूरी और अपडेटेड प्रोफाइल ग्राहकों को आपके व्यवसाय को समझने में मदद करती है।</p>
          <Link href="/add-business" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-5 py-3 font-bold text-white">मुफ्त बिज़नेस लिस्टिंग शुरू करें</Link>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-bold text-[#14243D]">Twimzi पर व्यवसाय कैसे खोजें?</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          <li className="rounded-xl border p-5"><h3 className="font-bold">1. श्रेणी चुनें</h3><p className="mt-2 text-sm leading-6 text-slate-600">निर्माता, थोक विक्रेता, उत्पाद या सेवाओं में से अपनी जरूरत चुनें।</p></li>
          <li className="rounded-xl border p-5"><h3 className="font-bold">2. प्रोफाइल देखें</h3><p className="mt-2 text-sm leading-6 text-slate-600">उपलब्ध व्यवसाय विवरण, स्थान और उत्पाद या सेवाओं की जानकारी पढ़ें।</p></li>
          <li className="rounded-xl border p-5"><h3 className="font-bold">3. जांच कर संपर्क करें</h3><p className="mt-2 text-sm leading-6 text-slate-600">संपर्क करने से पहले जरूरी विवरण और व्यावसायिक शर्तों की पुष्टि करें।</p></li>
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold text-[#14243D]">अक्सर पूछे जाने वाले सवाल</h2>
        <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-5">
          {faqs.map((faq) => (
            <article key={faq.question} className="py-5">
              <h3 className="font-bold text-[#14243D]">{faq.question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <nav aria-label="अन्य जानकारी" className="mt-12 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#0D9488]">
        <Link href="/about">Twimzi के बारे में</Link>
        <Link href="/contact">संपर्क करें</Link>
        <Link href="/blog">बिज़नेस ब्लॉग</Link>
        <Link href="/news">बिज़नेस समाचार</Link>
        <Link href="/free-business-listing-india">मुफ्त बिज़नेस लिस्टिंग</Link>
      </nav>
      <p className="mt-8 text-sm leading-6 text-slate-500">नोट: व्यवसाय की लिस्टिंग और उत्पादों या सेवाओं का विवरण संबंधित व्यवसायों द्वारा साझा किया जाता है। किसी भी खरीद या व्यावसायिक समझौते से पहले पहचान, गुणवत्ता, कीमत, भुगतान और डिलीवरी की शर्तों की स्वतंत्र रूप से जांच करें।</p>
    </main>
  );
}
