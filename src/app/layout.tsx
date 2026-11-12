
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  alternateName: "Twimzi Local Business Platform",
  url: siteConfig.url,
  logo: new URL(siteConfig.brand.logo, siteConfig.url).toString(),
  description:
    "Twimzi is a local business discovery platform where people can discover businesses, products, services and offers, and businesses can build their digital presence.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ludhiana",
    addressRegion: "Punjab",
    addressCountry: "IN",
  },
  sameAs: [
    "https://www.instagram.com/twimzi_official/",
    "https://www.facebook.com/profile.php?id=61595903981246",
    "https://www.linkedin.com/company/twimzi",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  publisher: { "@id": `${siteConfig.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/businesses?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  title: {
    default: siteConfig.seo.title,
    template: "%s",
  },

  description: siteConfig.seo.description,

  keywords: [...siteConfig.seo.keywords],

  applicationName: siteConfig.name,

  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],

  creator: siteConfig.name,
  publisher: siteConfig.name,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/icon.png?v=20261103-transparent",
        type: "image/png",
      },
      {
        url: "/favicon.ico?v=20261103-transparent",
        type: "image/x-icon",
      },
    ],
    apple: "/apple-icon.png?v=20261103-transparent",
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: [
      {
        url: "/twimzi-logo.png",
        width: 1200,
        height: 630,
        alt: "Twimzi",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: ["/twimzi-logo.png"],
  },

  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.variable} suppressHydrationWarning>
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
        <Header />
        <AnalyticsTracker />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
