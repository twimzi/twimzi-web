import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Business Listing in India – Add Your Business on Twimzi",
  description:
    "List your business online for free on Twimzi. Create a business profile, showcase products and services, share offers and help customers discover your business across India.",
  alternates: { canonical: "/add-business" },
  openGraph: {
    type: "website",
    url: "/add-business",
    title: "Free Business Listing in India | Twimzi",
    description:
      "Create your free Twimzi business listing and showcase your products, services and business profile to potential customers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Listing in India | Twimzi",
    description:
      "List your business online for free and help customers discover what you offer.",
  },
};

export default function AddBusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
