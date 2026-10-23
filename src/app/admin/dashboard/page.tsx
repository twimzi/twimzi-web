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

const statCards = [
  {
    key: "total_users",
    label: "Total Users",
    href: "/admin/users",
    icon: "users",
    color: "primary",
  },
  {
    key: "total_businesses",
    label: "Total Businesses",
    href: "/admin/businesses",
    icon: "building",
    color: "accent",
  },
  {
    key: "pending_businesses",
    label: "Pending Approval",
    href: "/admin/businesses?status=pending",
    icon: "clock",
    color: "warning",
  },
  {
    key: "approved_businesses",
    label: "Approved Businesses",
    href: "/admin/businesses?status=approved",
    icon: "check",
    color: "success",
  },
  {
    key: "total_products",
    label: "Products",
    href: "/admin/products",
    icon: "package",
    color: "primary",
  },
  {
    key: "total_services",
    label: "Services",
    href: "/admin/services",
    icon: "settings",
    color: "accent",
  },
  {
    key: "total_offers",
    label: "Offers",
    href: "/admin/offers",
    icon: "tag",
    color: "warning",
  },
  {
    key: "total_posts",
    label: "Community Posts",
    href: "/admin/posts",
    icon: "message",
    color: "success",
  },
  {
    key: "total_reports",
    label: "Reports",
    href: "/admin/reports",
    icon: "flag",
    color: "error",
  },
] as const;

function StatIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, React.ReactElement> = {
    users: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    building: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    package: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    tag: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7.01" />
      </svg>
    ),
    message: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    flag: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  };
  const colorClasses: Record<string, string> = {
    primary: "text-[var(--color-primary)] bg-[var(--color-primary-light)]",
    accent: "text-[var(--color-accent)] bg-[var(--color-accent-light)]",
    success: "text-[var(--color-success)] bg-[var(--color-success-light)]",
    warning: "text-[var(--color-warning)] bg-[var(--color-warning-light)]",
    error: "text-[var(--color-error)] bg-[var(--color-error-light)]",
  };
  return (
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>
      {icons[name] || icons.users}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

  const stats = (data?.[0] ?? null) as DashboardStats | null;

  return (
    <div className="pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Dashboard</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
          Twimzi Super Admin
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          Live platform overview from the Twimzi Supabase backend.
        </p>
      </div>

      {error || !stats ? (
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-error)]">Dashboard data unavailable</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-error)]/80">
            The dashboard could not load the current platform statistics.
          </p>
          {error?.message && (
            <p className="mt-2 text-xs text-[var(--color-error)]/60">{error.message}</p>
          )}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 mb-8">
            {statCards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="twimzi-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
                      {formatNumber(stats[card.key])}
                    </p>
                  </div>
                  <StatIcon name={card.icon} color={card.color} />
                </div>
                <p className="mt-4 text-xs font-semibold text-[var(--color-primary)]">Manage →</p>
              </Link>
            ))}
          </div>

          {/* Priority Actions Section */}
          <div className="grid gap-4 lg:grid-cols-2 mb-8">
            <Link
              href="/admin/businesses?status=pending"
              className="twimzi-card p-6 border-amber-200/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-warning)]">Business Approvals</p>
                  <p className="mt-2 text-3xl font-extrabold text-[var(--color-warning)]">
                    {stats.pending_businesses}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-warning)]/80">
                    businesses currently awaiting attention
                  </p>
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-warning-light)] text-[var(--color-warning)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="twimzi-card p-6 border-red-200/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-error)]">Reports & Moderation</p>
                  <p className="mt-2 text-3xl font-extrabold text-[var(--color-error)]">
                    {stats.total_reports}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-error)]/80">
                    reports available for review
                  </p>
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-error-light)] text-[var(--color-error)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Quick Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/businesses"
                className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition hover:bg-[var(--color-primary-dark)]"
              >
                Manage Businesses
              </Link>
              <Link
                href="/admin/reports"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
              >
                Review Reports
              </Link>
              <Link
                href="/admin/audit-logs"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
              >
                Audit Logs
              </Link>
              <Link
                href="/admin/users"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
              >
                Manage Users
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
              >
                System Settings
              </Link>
            </div>
          </section>

          {/* Platform Overview */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="text-lg font-bold text-[var(--color-text)]">Platform Overview</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Key metrics at a glance across the Twimzi marketplace.
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-[var(--color-text)]">{formatNumber(stats.total_users)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Registered Users</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-[var(--color-text)]">{formatNumber(stats.total_businesses)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Total Businesses</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-[var(--color-text)]">{formatNumber(stats.total_products + stats.total_services)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Listings</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-[var(--color-text)]">{formatNumber(stats.total_offers)}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Total Offers</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}