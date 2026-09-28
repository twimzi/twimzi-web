"use client";

import {
  BarChart3,
  ChevronRight,
  Eye,
  FileText,
  Gift,
  Heart,
  MessageCircle,
  Package,
  Plus,
  Send,
  Settings,
  Share2,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
  slug: string | null;
  business_type: string | null;
  business_status: string | null;
  verification_status: string | null;
  profile_completion: number | null;
  total_followers: number | null;
  total_views: number | null;
  is_featured: boolean | null;
  public_handle: string | null;
};

type DashboardSummary = {
  total_events: number;
  today_events: number;
  last_activity: string | null;
};

type MetricGroup = {
  views?: number;
  followers?: number;
  shares?: number;
  clicks?: number;
  calls?: number;
  whatsapp?: number;
  saved?: number;
  likes?: number;
  comments?: number;
  messages_sent?: number;
  messages_read?: number;
};

type DashboardData = {
  business_id: string;
  summary: DashboardSummary;
  business: MetricGroup;
  products: MetricGroup;
  services: MetricGroup;
  offers: MetricGroup;
  community: MetricGroup;
  chat: MetricGroup;
};

function numberValue(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function formatLastActivity(value: string | null) {
  if (!value) return "No activity yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No activity yet";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(value: string | null) {
  if (!value) return "Pending";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClasses(value: string | null) {
  const normalized = value?.toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "verified" ||
    normalized === "active"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "pending" ||
    normalized === "under_review" ||
    normalized === "submitted"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    normalized === "rejected" ||
    normalized === "suspended" ||
    normalized === "blocked"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ActivityCard({
  icon: Icon,
  title,
  value,
  items,
}: {
  icon: typeof Eye;
  title: string;
  value: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">{title}</h3>
            <p className="text-xs text-slate-500">Total activity</p>
          </div>
        </div>

        <span className="text-lg font-bold text-slate-950">{value}</span>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-slate-500">{item.label}</span>
            <span className="font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (!cancelled) {
            setError("Please sign in to access your business dashboard.");
          }
          return;
        }

        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select(
            "id,business_name,slug,business_type,business_status,verification_status,profile_completion,total_followers,total_views,is_featured,public_handle",
          )
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (businessError) {
          throw businessError;
        }

        if (!businessData) {
          if (!cancelled) {
            setError(
              "No active business profile was found for your account.",
            );
          }
          return;
        }

        const { data: dashboardData, error: dashboardError } =
          await supabase.rpc("get_business_dashboard", {
            p_business_id: businessData.id,
          });

        if (dashboardError) {
          throw dashboardError;
        }

        if (!cancelled) {
          setBusiness(businessData as Business);
          setDashboard((dashboardData ?? null) as DashboardData | null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load the business dashboard.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-32 rounded-2xl bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl bg-slate-200"
                />
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !business || !dashboard) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Store className="h-6 w-6 text-slate-600" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-950">
              Business dashboard unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ??
                "We could not find an active business profile for your account."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/add-business"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Business
              </Link>

              <Link
                href="/businesses"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Browse Businesses
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const profileCompletion = Math.min(
    100,
    Math.max(0, Number(business.profile_completion ?? 0)),
  );

  const totalPrimaryViews =
    Number(dashboard.business.views ?? 0) +
    Number(dashboard.products.views ?? 0) +
    Number(dashboard.services.views ?? 0) +
    Number(dashboard.offers.views ?? 0) +
    Number(dashboard.community.views ?? 0);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Business Dashboard
                </span>

                {business.verification_status && (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                      business.verification_status,
                    )}`}
                  >
                    {statusLabel(business.verification_status)}
                  </span>
                )}

                {business.is_featured && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {business.business_name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {business.business_type || "Business"} ·{" "}
                {statusLabel(business.business_status)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {business.slug && (
                <Link
                  href={`/businesses/${business.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  View Public Profile
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}

              <Link
                href="/messages"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <MessageCircle className="h-4 w-4" />
                Messages
              </Link>
            </div>
          </div>

          {/* Profile completion */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Profile completion
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Complete your business profile to provide customers with
                  better information.
                </p>
              </div>

              <span className="text-sm font-bold text-slate-950">
                {profileCompletion}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
        </section>

        {/* Primary stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Eye}
            label="Business Views"
            value={numberValue(dashboard.business.views)}
            description="Views recorded for your business profile."
          />

          <StatCard
            icon={Users}
            label="Followers"
            value={numberValue(
              business.total_followers ?? dashboard.business.followers,
            )}
            description="People currently following your business."
          />

          <StatCard
            icon={BarChart3}
            label="Total Activity"
            value={numberValue(dashboard.summary.total_events)}
            description={`${numberValue(
              dashboard.summary.today_events,
            )} events recorded today.`}
          />

          <StatCard
            icon={Share2}
            label="Business Shares"
            value={numberValue(dashboard.business.shares)}
            description="Times your business was shared."
          />
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage the main parts of your Twimzi business presence.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/businesses/dashboard/products"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Package className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                Manage Products
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add and manage your products.
              </p>
            </Link>

            <Link
              href="/businesses/dashboard/services"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                Manage Services
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Manage services offered by your business.
              </p>
            </Link>

            <Link
              href="/businesses/dashboard/offers"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Gift className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                Manage Offers
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Create and manage customer offers.
              </p>
            </Link>

            <Link
              href="/businesses/dashboard/posts"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                Community Posts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Publish and manage business content.
              </p>
            </Link>
          </div>
        </section>

        {/* Activity breakdown */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950">
              Business Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Activity recorded by the Twimzi analytics system.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ActivityCard
              icon={Package}
              title="Products"
              value={numberValue(
                Number(dashboard.products.views ?? 0) +
                  Number(dashboard.products.clicks ?? 0),
              )}
              items={[
                {
                  label: "Views",
                  value: numberValue(dashboard.products.views),
                },
                {
                  label: "Clicks",
                  value: numberValue(dashboard.products.clicks),
                },
              ]}
            />

            <ActivityCard
              icon={Wrench}
              title="Services"
              value={numberValue(
                Number(dashboard.services.views ?? 0) +
                  Number(dashboard.services.calls ?? 0) +
                  Number(dashboard.services.whatsapp ?? 0),
              )}
              items={[
                {
                  label: "Views",
                  value: numberValue(dashboard.services.views),
                },
                {
                  label: "Calls",
                  value: numberValue(dashboard.services.calls),
                },
                {
                  label: "WhatsApp",
                  value: numberValue(dashboard.services.whatsapp),
                },
              ]}
            />

            <ActivityCard
              icon={Gift}
              title="Offers"
              value={numberValue(
                Number(dashboard.offers.views ?? 0) +
                  Number(dashboard.offers.clicks ?? 0),
              )}
              items={[
                {
                  label: "Views",
                  value: numberValue(dashboard.offers.views),
                },
                {
                  label: "Clicks",
                  value: numberValue(dashboard.offers.clicks),
                },
                {
                  label: "Saved",
                  value: numberValue(dashboard.offers.saved),
                },
              ]}
            />

            <ActivityCard
              icon={Heart}
              title="Community"
              value={numberValue(
                Number(dashboard.community.views ?? 0) +
                  Number(dashboard.community.likes ?? 0) +
                  Number(dashboard.community.comments ?? 0) +
                  Number(dashboard.community.shares ?? 0),
              )}
              items={[
                {
                  label: "Views",
                  value: numberValue(dashboard.community.views),
                },
                {
                  label: "Likes",
                  value: numberValue(dashboard.community.likes),
                },
                {
                  label: "Comments",
                  value: numberValue(dashboard.community.comments),
                },
                {
                  label: "Shares",
                  value: numberValue(dashboard.community.shares),
                },
              ]}
            />

            <ActivityCard
              icon={MessageCircle}
              title="Messaging"
              value={numberValue(
                Number(dashboard.chat.messages_sent ?? 0) +
                  Number(dashboard.chat.messages_read ?? 0),
              )}
              items={[
                {
                  label: "Messages sent",
                  value: numberValue(dashboard.chat.messages_sent),
                },
                {
                  label: "Messages read",
                  value: numberValue(dashboard.chat.messages_read),
                },
              ]}
            />

            <ActivityCard
              icon={BarChart3}
              title="Overall Reach"
              value={numberValue(totalPrimaryViews)}
              items={[
                {
                  label: "Business views",
                  value: numberValue(dashboard.business.views),
                },
                {
                  label: "Product views",
                  value: numberValue(dashboard.products.views),
                },
                {
                  label: "Service views",
                  value: numberValue(dashboard.services.views),
                },
                {
                  label: "Offer views",
                  value: numberValue(dashboard.offers.views),
                },
              ]}
            />
          </div>
        </section>

        {/* Bottom information */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Store className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Business Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Current public business information
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Status</span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                    business.business_status,
                  )}`}
                >
                  {statusLabel(business.business_status)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Verification</span>
                <span className="text-sm font-semibold text-slate-900">
                  {statusLabel(business.verification_status)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Total Views</span>
                <span className="text-sm font-semibold text-slate-900">
                  {numberValue(business.total_views)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Last Activity
                </span>
                <span className="text-right text-sm font-semibold text-slate-900">
                  {formatLastActivity(dashboard.summary.last_activity)}
                </span>
              </div>
            </div>

            <Link
              href="/businesses/dashboard/settings"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:underline"
            >
              <Settings className="h-4 w-4" />
              Business Settings
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Send className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Messaging
                </h2>
                <p className="text-xs text-slate-500">
                  Communicate with customers and businesses
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Sent</p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {numberValue(dashboard.chat.messages_sent)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Read</p>
                <p className="mt-1 text-xl font-bold text-slate-950">
                  {numberValue(dashboard.chat.messages_read)}
                </p>
              </div>
            </div>

            <Link
              href="/messages"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <MessageCircle className="h-4 w-4" />
              Open Messages
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}