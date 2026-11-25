"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MessageCircle,
  UserRound,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from "lucide-react";
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

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

      if (!mounted) return;

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

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    setIsAuthenticated(false);
    setIsBusinessOwner(false);
    setIsSuperAdmin(false);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const accountActionHref =
    isAuthenticated && isBusinessOwner ? "/businesses/dashboard" : "/add-business";
  const accountActionLabel =
    isAuthenticated && isBusinessOwner ? "Manage Business" : "Free Listing";

  const activeClass =
    "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]";
  const idleClass =
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text)]";

  const searchAction = (
    <Link
      href="/explore"
      onClick={closeMenus}
      aria-label="Search businesses and products"
      title="Search"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
    >
      <Search aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.9} />
    </Link>
  );

  const messagesAction = isAuthenticated ? (
    <Link
      href="/messages"
      onClick={closeMenus}
      aria-label="Messages"
      title="Messages"
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${pathname === "/messages" || pathname.startsWith("/messages/") ? activeClass : idleClass}`}
    >
      <MessageCircle aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.9} />
    </Link>
  ) : null;

  const listingAction = (
    <Link
      href={accountActionHref}
      onClick={closeMenus}
      className="twimzi-gradient-button inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold !text-white shadow-sm transition hover:brightness-110 sm:px-5 sm:text-sm"
    >
      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
      <span>{accountActionLabel}</span>
    </Link>
  );

  const profileMenu = isAuthenticated ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsProfileMenuOpen((open) => !open)}
        aria-expanded={isProfileMenuOpen}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className={`inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] ${isProfileMenuOpen ? activeClass : "bg-white"}`}
      >
        <UserRound className="h-[17px] w-[17px]" strokeWidth={1.9} />
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
      </button>
      {isProfileMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-[60] w-56 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-xl"
        >
          {isBusinessOwner && (
            <Link href="/businesses/dashboard" role="menuitem" onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-primary-light)]">
              <LayoutDashboard className="h-4 w-4 text-[var(--color-primary)]" /> Business dashboard
            </Link>
          )}
          {isSuperAdmin && (
            <Link href="/admin" role="menuitem" onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-primary-light)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" /> Admin panel
            </Link>
          )}
          <div className="my-1 border-t border-[var(--color-border-light)]" />
          <button type="button" role="menuitem" onClick={handleLogout} disabled={isSigningOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-light)] disabled:opacity-60">
            <LogOut className="h-4 w-4" /> {isSigningOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link
      href="/login"
      onClick={closeMenus}
      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
    >
      Log in
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 shadow-[0_1px_3px_rgba(20,36,61,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 xl:px-8">
        <Link href="/" aria-label="Twimzi home" onClick={closeMenus} className="flex w-[112px] shrink-0 items-center">
          <Image src="/twimzi-logo.png" alt="Twimzi" width={120} height={40} priority className="h-9 w-auto object-contain" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 2xl:gap-1 xl:flex" aria-label="Main navigation">
          {mainNavigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                className={`whitespace-nowrap rounded-full px-2 py-2 text-[11px] font-semibold transition 2xl:px-2.5 2xl:text-xs ${isActive ? activeClass : idleClass}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center justify-end gap-1.5 xl:flex 2xl:gap-2">
          {searchAction}
          {messagesAction}
          {!isSessionLoading && (isAuthenticated ? listingAction : <>{profileMenu}<Link href="/add-business" onClick={closeMenus} className="twimzi-gradient-button inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-full px-4 py-2 text-xs font-bold !text-white shadow-sm transition hover:brightness-110 2xl:px-5 2xl:text-sm"><Plus className="h-4 w-4" /> Free Listing</Link></>)}
          {!isSessionLoading && isAuthenticated ? profileMenu : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 xl:hidden">
          {searchAction}
          {messagesAction}
          {!isSessionLoading && (isAuthenticated ? listingAction : profileMenu)}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[var(--color-border)] bg-white xl:hidden">
          <nav className="mx-auto grid max-w-7xl grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-3 sm:px-6" aria-label="Mobile navigation">
            {mainNavigation.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} onClick={closeMenus} className={`rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? activeClass : idleClass}`}>
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link href="/messages" onClick={closeMenus} className={`rounded-xl px-3 py-3 text-sm font-medium transition ${pathname.startsWith("/messages") ? activeClass : idleClass}`}>Messages</Link>
            )}
            {isSuperAdmin && <Link href="/admin" onClick={closeMenus} className={`rounded-xl px-3 py-3 text-sm font-medium transition ${idleClass}`}>Admin panel</Link>}
            {isAuthenticated && isBusinessOwner && <Link href="/businesses/dashboard" onClick={closeMenus} className={`rounded-xl px-3 py-3 text-sm font-medium transition ${idleClass}`}>Business dashboard</Link>}
            {isAuthenticated && <button type="button" onClick={handleLogout} disabled={isSigningOut} className="rounded-xl px-3 py-3 text-left text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-light)]">{isSigningOut ? "Signing out..." : "Log out"}</button>}
          </nav>
        </div>
      )}
    </header>
  );
}
