import Link from "next/link";

const discoverLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
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
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Twimzi
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
              Digital Operating System for Every Local Business.
            </p>

            <a
              href="mailto:support@twimzi.com"
              className="mt-4 inline-block text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              support@twimzi.com
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Discover
            </h2>

            <ul className="mt-4 space-y-3">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              For Business
            </h2>

            <ul className="mt-4 space-y-3">
              {businessLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-sm font-semibold text-slate-900">
              Company
            </h2>

            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Legal & Policies
            </h2>

            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Twimzi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}