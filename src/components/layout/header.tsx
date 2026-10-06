"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const mainNavigation = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
] as const;

const actionLinkClass =
  "rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]";

const primaryLinkClass =
  "rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!user) {
        setIsAuthenticated(false);
        setIsBusinessOwner(false);
        setIsSuperAdmin(false);
        setIsSessionLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const [{ data: business }, { data: superAdmin }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id")
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle(),
        supabase.rpc("is_super_admin"),
      ]);

      if (!mounted) {
        return;
      }

      setIsBusinessOwner(Boolean(business));
      setIsSuperAdmin(superAdmin === true);
      setIsSessionLoading(false);
    };

    void loadAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadAccess();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    setIsAuthenticated(false);
    setIsBusinessOwner(false);
    setIsSuperAdmin(false);
    setIsMobileMenuOpen(false);

    router.push("/");
    router.refresh();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const accountActionLabel = isBusinessOwner
    ? "Manage Your Business"
    : "Add Business";

  const accountActionHref = isBusinessOwner
    ? "/businesses/dashboard"
    : "/add-business";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Twimzi home"
          onClick={closeMobileMenu}
        >
          <Image
            src="/twimzi-logo.png"
            alt="Twimzi"
            width={120}
            height={40}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {mainNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {!isSessionLoading && isAuthenticated && (
            <Link
              href="/messages"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/messages" || pathname.startsWith("/messages/")
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
              }`}
            >
              Messages
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isSessionLoading && isAuthenticated ? (
            <>
              {isSuperAdmin && (
                <Link href="/admin" className={actionLinkClass}>
                  Admin
                </Link>
              )}

              <Link href={accountActionHref} className={actionLinkClass}>
                {accountActionLabel}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Logout"}
              </button>
            </>
          ) : !isSessionLoading ? (
            <>
              <Link href="/login" className={actionLinkClass}>
                Login
              </Link>

              <Link href="/add-business" className={primaryLinkClass}>
                Add Business
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-xl text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[var(--color-border)] bg-white md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6"
            aria-label="Mobile navigation"
          >
            {mainNavigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-[var(--color-border-light)] pt-3">
              {!isSessionLoading && isAuthenticated ? (
                <>
                  <Link
                    href="/messages"
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                  >
                    Messages
                  </Link>

                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                    >
                      Admin
                    </Link>
                  )}

                  <Link
                    href={accountActionHref}
                    onClick={closeMobileMenu}
                    className="mt-1 block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                  >
                    {accountActionLabel}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="mt-1 block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? "Signing out..." : "Logout"}
                  </button>
                </>
              ) : !isSessionLoading ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                  >
                    Login
                  </Link>

                  <Link
                    href="/add-business"
                    onClick={closeMobileMenu}
                    className="mt-2 block rounded-lg bg-[var(--color-primary)] px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
                  >
                    Add Business
                  </Link>
                </>
              ) : null}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}