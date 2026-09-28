import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
} from "lucide-react";

const discoverLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
  { label: "Community", href: "/community" },
];

const businessLinks = [
  { label: "Add Your Business", href: "/add-business" },
  { label: "Promote an Offer", href: "/offers" },
  { label: "Contact Us", href: "/contact" },
];

const companyLinks = [
  { label: "About Twimzi", href: "/about" },
  { label: "Support", href: "/contact" },
  { label: "Login", href: "/login" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "Community Guidelines", href: "/community-guidelines" },
  { label: "Business Terms", href: "/business-terms" },
  { label: "Marketplace Policy", href: "/marketplace-policy" },
  { label: "User Content Policy", href: "/user-content-policy" },
  {
    label: "Intellectual Property",
    href: "/intellectual-property-policy",
  },
  { label: "Messaging Policy", href: "/messaging-policy" },
  { label: "Data Deletion & Retention", href: "/data-deletion-policy" },
  { label: "Grievance Redressal", href: "/grievance-redressal" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Refund & Cancellation", href: "/refund-policy" },
  { label: "Shipping & Delivery", href: "/shipping-policy" },
  { label: "Platform Disclaimer", href: "/disclaimer" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_.85fr_.85fr_1.15fr] lg:gap-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg text-2xl font-bold tracking-tight text-[var(--color-text)] transition hover:text-[var(--color-primary)]"
            >
              Twimzi
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--color-text-secondary)]">
              Digital Operating System for Every Local Business.
            </p>

            <a
              href="mailto:support@twimzi.com"
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-2 py-1 -ml-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-white hover:text-[var(--color-primary-dark)]"
            >
              <Mail className="h-4 w-4" />
              support@twimzi.com
            </a>
          </div>

          {/* Discover */}
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">
              Discover
            </h2>

            <ul className="mt-5 space-y-3">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex text-sm text-[var(--color-text-secondary)] transition hover:translate-x-0.5 hover:text-[var(--color-primary-dark)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business / Company */}
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">
              For Business
            </h2>

            <ul className="mt-5 space-y-3">
              {businessLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex text-sm text-[var(--color-text-secondary)] transition hover:translate-x-0.5 hover:text-[var(--color-primary-dark)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-9 text-sm font-bold text-[var(--color-text)]">
              Company
            </h2>

            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex text-sm text-[var(--color-text-secondary)] transition hover:translate-x-0.5 hover:text-[var(--color-primary-dark)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">
              Legal & Policies
            </h2>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary-dark)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Twimzi. All rights reserved.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
          >
            Back to top
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}