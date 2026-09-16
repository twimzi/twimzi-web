import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const sections = [
  ["Overview", [["Dashboard", "/admin/dashboard"]]],
  [
    "Business",
    [
      ["Businesses", "/admin/businesses"],
      ["Products", "/admin/products"],
      ["Services", "/admin/services"],
      ["Categories", "/admin/categories"],
    ],
  ],
  [
    "Community",
    [
      ["Posts", "/admin/posts"],
      ["Community", "/admin/community"],
      ["Reports", "/admin/reports"],
      ["Moderation", "/admin/moderation"],
    ],
  ],
  [
    "Growth",
    [
      ["Analytics", "/admin/analytics"],
      ["Featured", "/admin/featured"],
      ["Offers", "/admin/offers"],
    ],
  ],
  [
    "Users",
    [
      ["Users", "/admin/users"],
      ["Roles & Permissions", "/admin/roles"],
    ],
  ],
  [
    "System",
    [
      ["Notifications", "/admin/notifications"],
      ["Media", "/admin/media"],
      ["Settings", "/admin/settings"],
      ["Audit Logs", "/admin/audit-logs"],
    ],
  ],
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isSuperAdmin, error } = await supabase.rpc(
    "is_super_admin",
  );

  if (error || isSuperAdmin !== true) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--color-border)] bg-white lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto p-5">
            <Link
              href="/admin/dashboard"
              className="block"
              aria-label="Twimzi Super Admin"
            >
              <Image
                src="/twimzi-logo.png"
                alt="Twimzi"
                width={769}
                height={650}
                priority
                className="h-14 w-auto object-contain object-left"
              />

              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Super Admin
              </div>
            </Link>

            <nav className="mt-8 space-y-6">
              {sections.map(([title, items]) => (
                <div key={title}>
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    {title}
                  </p>

                  <div className="mt-2 space-y-1">
                    {items.map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-[var(--color-border)] bg-white px-5 py-4 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                  Twimzi Control Center
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Manage the platform and its shared Supabase backend.
                </p>
              </div>

              <Link
                href="/"
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-primary-light)]"
              >
                View Website
              </Link>
            </div>
          </div>

          <div className="px-5 py-7 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
