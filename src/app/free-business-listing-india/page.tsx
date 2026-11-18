import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Store, Users, Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Business Listing in India | List Your Business on Twimzi",
  description:
    "Create a free business listing in India on Twimzi. Add your company profile, location, products and services to help customers and business buyers discover you.",
  alternates: { canonical: "https://www.twimzi.com/free-business-listing-india" },
  openGraph: {
    type: "website",
    url: "https://www.twimzi.com/free-business-listing-india",
    title: "Free Business Listing in India | Twimzi",
    description:
      "Create a business profile on Twimzi and help customers discover your company, products and services.",
  },
};

const benefits = [
  {
    icon: Store,
    title: "Create your business profile",
    description:
      "Present your business name, category, location, description and contact information in one public profile.",
  },
  {
    icon: Users,
    title: "Reach people searching for businesses",
    description:
      "Help customers, local buyers and potential business partners find your profile while exploring Twimzi.",
  },
  {
    icon: Megaphone,
    title: "Showcase what you offer",
    description:
      "Add relevant products, services, business updates and offers as those features become available to your account.",
  },
];

const steps = [
  "Open the business registration page and sign in to your Twimzi account.",
  "Enter your business details, category and operating location.",
  "Add a clear description and relevant contact information. You can also add a logo, cover image and gallery photos.",
  "Submit your profile. Submitted businesses are reviewed before they appear publicly.",
];

export default function FreeBusinessListingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Free Business Listing in India",
    description: "Create a business profile on Twimzi to improve online business discovery.",
    url: "https://www.twimzi.com/free-business-listing-india",
    isPartOf: {
      "@type": "WebSite",
      name: "Twimzi",
      url: "https://www.twimzi.com",
    },
  };

  return (
    <main className="bg-[var(--color-background)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Twimzi business directory
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
            Free business listing in India
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] sm:text-lg">
            Bring your business online with a public profile on Twimzi. Add your
            company details, location, products and services so people exploring
            businesses in India can learn about what you offer and contact you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/add-business"
              className="inline-flex items-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              List your business for free
            </Link>
            <Link
              href="/businesses"
              className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              Explore businesses
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
            Public visibility begins after submission review. A listing does not guarantee leads, sales or search rankings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Why create a business listing on Twimzi?
          </h2>
          <p className="mt-4 leading-7 text-[var(--color-text-secondary)]">
            A useful business listing gives people a clear starting point when
            they want to understand a company before making contact. Twimzi is
            designed for Indian manufacturers, traders, wholesalers, retailers,
            professionals and service providers that want a digital presence
            alongside their existing channels.
          </p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--color-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              How to add your business online
            </h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/add-business"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline"
            >
              Start business registration
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-[var(--color-secondary)] p-7">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              What businesses can join?
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              Twimzi supports a broad range of business profiles, including
              manufacturers, wholesalers, distributors, traders, local shops,
              retailers, professional firms and service providers. Use the
              category that best describes your primary business activity and
              keep the profile information accurate and current.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
              {["Manufacturers", "Suppliers & wholesalers", "Traders & distributors", "Retail shops", "Professionals", "Home service providers"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-bold text-[var(--color-text)]">Is business listing on Twimzi free?</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                You can start creating a business profile through the Twimzi registration page without a listing fee being requested in this flow. Review any plan or feature terms shown in your account before purchasing optional services.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text)]">How long does it take for my business to appear?</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                Submitted businesses are subject to review and approval. Public visibility starts after the profile is approved.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text)]">Can manufacturers and wholesalers list their businesses?</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                Yes. Manufacturers, wholesalers, traders, distributors, retailers, professionals and service providers can create profiles using the most relevant business category.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text)]">Does a listing guarantee customers or sales?</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                No. A profile helps people discover and learn about your business, but enquiries and sales depend on customer demand, profile quality, location, products and other factors.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[var(--color-primary)] px-7 py-10 text-white sm:px-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Give your business a place to be discovered.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90">
            Create your Twimzi profile and share accurate information about your business with people looking for products and services.
          </p>
          <Link
            href="/add-business"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:opacity-90"
          >
            Create your business profile
          </Link>
        </div>
      </section>
    </main>
  );
}
