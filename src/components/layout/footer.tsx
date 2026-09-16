import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-secondary)]">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/twimzi-logo.png"
              alt="Twimzi"
              width={769}
              height={650}
              className="h-16 w-auto object-contain"
            />

            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]">
              {siteConfig.tagline}. Discover, connect and grow locally.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Discover</h3>

            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/explore"
              >
                Explore
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/businesses"
              >
                Businesses
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/products"
              >
                Products
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/services"
              >
                Services
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Business</h3>

            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/add-business"
              >
                Add Your Business
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/offers"
              >
                Promote an Offer
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/contact"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>

            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/about"
              >
                About Twimzi
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/contact"
              >
                Support
              </Link>

              <Link
                className="block transition-colors hover:text-[var(--color-primary)]"
                href="/login"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] py-6 text-xs text-[var(--color-text-muted)] sm:flex-row sm:justify-between">
          <span>
            Â© {new Date().getFullYear()} Twimzi. All rights reserved.
          </span>

          <span>Built for local businesses and communities.</span>
        </div>
      </Container>
    </footer>
  );
}
