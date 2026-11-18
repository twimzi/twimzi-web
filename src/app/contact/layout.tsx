import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Twimzi Support | Business & Partnership Enquiries",
  description: "Contact Twimzi for business onboarding, account support, partnerships, feedback or grievances. Reach the team and submit a support request.",
  alternates: { canonical: "https://www.twimzi.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
