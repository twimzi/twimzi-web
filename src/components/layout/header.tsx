"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const mainNavigation = [
  { label: "Explore", href: "/explore" },
  { label: "Businesses", href: "/businesses" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Offers", href: "/offers" },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsSessionLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsSessionLoading(false);
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
    setIsMobileMenuOpen(false);

    router.push("/");
    router.refresh();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Twimzi home"
          onClick={closeMobileMenu}
        >
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Twimzi
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isSessionLoading && isAuthenticated ? (
            <>
              <Link
                href="/admin"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Admin
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Login
              </Link>

              <Link
                href="/add-business"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Business
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 transition hover:bg-slate-50 md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6"
            aria-label="Mobile navigation"
          >
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-slate-100 pt-3">
              {!isSessionLoading && isAuthenticated ? (
                <>
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Admin
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="mt-1 block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? "Signing out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Login
                  </Link>

                  <Link
                    href="/add-business"
                    onClick={closeMobileMenu}
                    className="mt-2 block rounded-lg bg-slate-900 px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add Business
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}