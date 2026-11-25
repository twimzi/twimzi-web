"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const mainNavigation = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Calculators", href: "/tools/calculators" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
  { label: "Business News", href: "/news" },
] as const;

const actionLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f1f4f7] hover:text-black";

const primaryLinkClass =
  "twimzi-gradient-button inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold !text-white shadow-sm transition hover:brightness-110";

const searchLinkClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]";

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
    ? "Manage Business"
    : "Free Listing";

  const accountActionHref = isBusinessOwner
    ? "/businesses/dashboard"
    : "/add-business";

  const listingAction = (
    <Link
      href={isSessionLoading || !isAuthenticated ? "/add-business" : accountActionHref}
      className={primaryLinkClass}
      onClick={closeMobileMenu}
    >
      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
      <span>{isAuthenticated ? accountActionLabel : "Free Listing"}</span>
    </Link>
  );

  const searchAction = (
    <Link
      href="/explore"
      className={searchLinkClass}
      aria-label="Search businesses and products"
      title="Search"
      onClick={closeMobileMenu}
    >
      <Search aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 shadow-[0_1px_3px_rgba(15,23,42,0.035)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-3 sm:gap-6 sm:px-8 xl:px-10">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Twimzi home"
          onClick={closeMobileMenu}
        >
          <Image
            src="/twimzi-logo.png"
            alt="Twimzi"
            width={120}
            height={40}
            priority
            className="h-8 w-auto object-contain sm:h-10"
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-1.5"
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
                    ? "bg-[#f1f4f7] text-[#0a1317]"
                    : "text-[#444950] hover:bg-[#f1f4f7] hover:text-[#0a1317]"
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

        <div className="ml-auto hidden shrink-0 items-center justify-end gap-2 lg:flex">
          {searchAction}
          {!isSessionLoading && isAuthenticated ? (
            <>
              {isSuperAdmin && (
                <Link href="/admin" className={actionLinkClass}>
                  Admin
                </Link>
              )}
              {listingAction}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="min-h-11 rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Logout"}
              </button>
            </>
          ) : !isSessionLoading ? (
            <>
              <Link href="/login" className={actionLinkClass}>
                Log in
              </Link>
              {listingAction}
            </>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:hidden">
          {searchAction}
          {!isSessionLoading && (
            <>
              {isAuthenticated ? (
                listingAction
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[#1c1e21] transition hover:bg-[#f1f4f7] sm:px-4 sm:text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/add-business"
                    className="twimzi-gradient-button inline-flex min-h-10 items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold !text-white shadow-sm transition hover:brightness-110 sm:px-4 sm:text-sm"
                  >
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Free Listing
                  </Link>
                </>
              )}
            </>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[var(--color-border)] bg-white lg:hidden">
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
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
