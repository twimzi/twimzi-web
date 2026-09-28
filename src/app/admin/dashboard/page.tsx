import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardStats = {
  total_users: number;
  total_businesses: number;
  pending_businesses: number;
  approved_businesses: number;
  total_products: number;
  total_services: number;
  total_offers: number;
  total_posts: number;
  total_reports: number;
};

const cards = [
  { key: "total_users", label: "Users", href: "/admin/users" },
  { key: "total_businesses", label: "Businesses", href: "/admin/businesses" },
  {
    key: "pending_businesses",
    label: "Pending Businesses",
    href: "/admin/businesses?status=pending",
  },
  {
    key: "approved_businesses",
    label: "Approved Businesses",
    href: "/admin/businesses?status=approved",
  },
  { key: "total_products", label: "Products", href: "/admin/products" },
  { key: "total_services", label: "Services", href: "/admin/services" },
  { key: "total_offers", label: "Offers", href: "/admin/offers" },
  { key: "total_posts", label: "Posts", href: "/admin/posts" },
  { key: "total_reports", label: "Reports", href: "/admin/reports" },
] as const;

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

  const stats = (data?.[0] ?? null) as DashboardStats | null;

  return (
    <div className="pb-12">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Twimzi Super Admin
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Live platform overview from the Twimzi Supabase backend.
        </p>
      </div>

      {error || !stats ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-900">
            Dashboard data unavailable
          </h2>

          <p className="mt-1 text-sm leading-6 text-red-700">
            The dashboard could not load the current platform statistics.
          </p>

          {error?.message ? (
            <p className="mt-2 text-xs text-red-600">{error.message}</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats[card.key]}
                </p>

                <p className="mt-4 text-xs font-semibold text-[var(--color-primary)]">
                  Manage →
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Link
              href="/admin/businesses?status=pending"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-6 transition hover:shadow-md"
            >
              <p className="text-sm font-semibold text-amber-800">
                Business approvals
              </p>

              <p className="mt-2 text-3xl font-extrabold text-amber-950">
                {stats.pending_businesses}
              </p>

              <p className="mt-1 text-sm text-amber-800">
                businesses currently awaiting attention
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 transition hover:shadow-md"
            >
              <p className="text-sm font-semibold text-red-800">
                Reports & moderation
              </p>

              <p className="mt-2 text-3xl font-extrabold text-red-950">
                {stats.total_reports}
              </p>

              <p className="mt-1 text-sm text-red-800">
                reports available for review
              </p>
            </Link>
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Owner control center
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Administrative actions remain protected by Supabase authentication,
          super-admin authorization, RLS policies, server-side checks and
          audit controls.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/businesses"
            className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
          >
            Manage Businesses
          </Link>

          <Link
            href="/admin/reports"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold !text-slate-700 transition hover:bg-slate-50"
          >
            Review Reports
          </Link>

          <Link
            href="/admin/audit-logs"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold !text-slate-700 transition hover:bg-slate-50"
          >
            Audit Logs
          </Link>
        </div>
      </div>
    </div>
  );
}