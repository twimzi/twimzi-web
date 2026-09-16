import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardStats = {
  total_users: number;
  total_businesses: number;
  total_products: number;
  total_services: number;
  total_posts: number;
  total_reports: number;
  pending_businesses: number;
  pending_verifications: number;
  pending_reports: number;
};

const DEFAULT_STATS: DashboardStats = {
  total_users: 0,
  total_businesses: 0,
  total_products: 0,
  total_services: 0,
  total_posts: 0,
  total_reports: 0,
  pending_businesses: 0,
  pending_verifications: 0,
  pending_reports: 0,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_dashboard_stats");

  const row = Array.isArray(data) ? data[0] : data;

  const stats: DashboardStats = {
    total_users: Number(row?.total_users ?? DEFAULT_STATS.total_users),
    total_businesses: Number(
      row?.total_businesses ?? DEFAULT_STATS.total_businesses,
    ),
    total_products: Number(
      row?.total_products ?? DEFAULT_STATS.total_products,
    ),
    total_services: Number(
      row?.total_services ?? DEFAULT_STATS.total_services,
    ),
    total_posts: Number(row?.total_posts ?? DEFAULT_STATS.total_posts),
    total_reports: Number(row?.total_reports ?? DEFAULT_STATS.total_reports),
    pending_businesses: Number(
      row?.pending_businesses ?? DEFAULT_STATS.pending_businesses,
    ),
    pending_verifications: Number(
      row?.pending_verifications ?? DEFAULT_STATS.pending_verifications,
    ),
    pending_reports: Number(
      row?.pending_reports ?? DEFAULT_STATS.pending_reports,
    ),
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users,
      href: "/admin/users",
      description: "Registered platform users",
    },
    {
      label: "Total Businesses",
      value: stats.total_businesses,
      href: "/admin/businesses",
      description: "Businesses on Twimzi",
    },
    {
      label: "Total Products",
      value: stats.total_products,
      href: "/admin/products",
      description: "Published product records",
    },
    {
      label: "Total Services",
      value: stats.total_services,
      href: "/admin/services",
      description: "Services listed",
    },
    {
      label: "Total Posts",
      value: stats.total_posts,
      href: "/admin/posts",
      description: "Business and community posts",
    },
    {
      label: "Total Reports",
      value: stats.total_reports,
      href: "/admin/reports",
      description: "Submitted platform reports",
    },
  ];

  const priorityCards = [
    {
      label: "Business Approvals",
      value: stats.pending_businesses,
      href: "/admin/businesses",
    },
    {
      label: "Pending Verifications",
      value: stats.pending_verifications,
      href: "/admin/businesses",
    },
    {
      label: "Pending Reports",
      value: stats.pending_reports,
      href: "/admin/reports",
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Dashboard
        </p>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Twimzi Super Admin
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
              Live platform overview powered by the secure admin statistics
              service.
            </p>
          </div>

          <Link
            href="/admin/audit-logs"
            className="inline-flex w-fit items-center rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold transition hover:shadow-sm"
          >
            View Audit Logs â†’
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load live dashboard statistics. Please verify the admin
          dashboard RPC configuration.
        </div>
      ) : null}

      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-extrabold tracking-tight">
                    {formatNumber(card.value)}
                  </p>

                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {card.description}
                  </p>
                </div>

                <span className="rounded-xl bg-[var(--color-primary)]/10 px-3 py-2 text-xs font-bold text-[var(--color-primary)]">
                  Live
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold text-[var(--color-primary)] transition group-hover:translate-x-0.5">
                Manage â†’
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Priority & Alerts</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Items requiring administrator attention.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {priorityCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                {card.label}
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                {formatNumber(card.value)}
              </p>

              <p className="mt-3 text-xs font-semibold text-[var(--color-primary)]">
                View all â†’
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-bold">Owner Control Center</h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Privileged administrator operations remain protected by
          SUPER_ADMIN authorization and Supabase RPC security. Sensitive
          database credentials are never exposed to the browser.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/businesses"
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Manage Businesses
          </Link>

          <Link
            href="/admin/users"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold transition hover:shadow-sm"
          >
            Manage Users
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold transition hover:shadow-sm"
          >
            System Settings
          </Link>
        </div>
      </section>
    </div>
  );
}
