"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { mainNavigation } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Header() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setIsAuthenticated(Boolean(session));
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(Boolean(session));
      }
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
    setOpen(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setIsSigningOut(false);
      return;
    }

    setIsAuthenticated(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <Container>
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            onClick={() => setOpen(false)}
            aria-label="Twimzi home"
          >
            <Image
              src="/twimzi-logo.png"
              alt="Twimzi"
              width={769}
              height={650}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Logging out..." : "Logout"}
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                >
                  Login
                </Link>

                <Link href="/add-business">
                  <Button>Add Business</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xl text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] lg:hidden"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>

        {open && (
          <nav className="border-t border-[var(--color-border)] py-4 lg:hidden">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 flex gap-2">
              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Logging out..." : "Logout"}
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>

                  <Link
                    href="/add-business"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    <Button className="w-full">Add Business</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}