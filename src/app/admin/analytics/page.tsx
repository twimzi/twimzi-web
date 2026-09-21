"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TopEvent = {
  event_name: string | null;
  event_count: number;
};

type PlatformBreakdown = {
  platform: string | null;
  event_count: number;
};

type DeviceBreakdown = {
  device_type: string | null;
  event_count: number;
};

type DailyEvent = {
  date: string;
  event_count: number;
};

type AnalyticsStats = {
  total_events: number;
  events_today: number;
  events_last_7_days: number;
  events_last_30_days: number;
  unique_users: number;
  unique_businesses: number;
  top_events: TopEvent[];
  platform_breakdown: PlatformBreakdown[];
  device_breakdown: DeviceBreakdown[];
  daily_events: DailyEvent[];
};

function numberFormat(value: number) {
  return value.toLocaleString("en-IN");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function getBarWidth(value: number, maximum: number) {
  if (!maximum || !value) return "0%";

  return `${Math.max(4, Math.round((value / maximum) * 100))}%`;
}

export default function AdminAnalyticsPage() {
  const supabase = createSupabaseBrowserClient();

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_super_admin");

      if (adminError) {
        throw adminError;
      }

      if (!adminCheck) {
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      const { data, error: analyticsError } = await supabase.rpc(
        "admin_analytics_stats",
      );

      if (analyticsError) {
        throw analyticsError;
      }

      setStats({
        total_events: Number(data?.total_events ?? 0),
        events_today: Number(data?.events_today ?? 0),
        events_last_7_days: Number(data?.events_last_7_days ?? 0),
        events_last_30_days: Number(data?.events_last_30_days ?? 0),
        unique_users: Number(data?.unique_users ?? 0),
        unique_businesses: Number(data?.unique_businesses ?? 0),
        top_events: Array.isArray(data?.top_events)
          ? data.top_events.map((item: TopEvent) => ({
              event_name: item.event_name,
              event_count: Number(item.event_count ?? 0),
            }))
          : [],
        platform_breakdown: Array.isArray(data?.platform_breakdown)
          ? data.platform_breakdown.map(
              (item: PlatformBreakdown) => ({
                platform: item.platform,
                event_count: Number(item.event_count ?? 0),
              }),
            )
          : [],
        device_breakdown: Array.isArray(data?.device_breakdown)
          ? data.device_breakdown.map((item: DeviceBreakdown) => ({
              device_type: item.device_type,
              event_count: Number(item.event_count ?? 0),
            }))
          : [],
        daily_events: Array.isArray(data?.daily_events)
          ? data.daily_events.map((item: DailyEvent) => ({
              date: item.date,
              event_count: Number(item.event_count ?? 0),
            }))
          : [],
      });
    } catch (err) {
      setStats(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAnalytics]);

  const dailyMaximum = useMemo(() => {
    return Math.max(
      ...(stats?.daily_events.map((item) => item.event_count) ?? [0]),
    );
  }, [stats]);

  const topEventMaximum = useMemo(() => {
    return Math.max(
      ...(stats?.top_events.map((item) => item.event_count) ?? [0]),
    );
  }, [stats]);

  const platformMaximum = useMemo(() => {
    return Math.max(
      ...(stats?.platform_breakdown.map(
        (item) => item.event_count,
      ) ?? [0]),
    );
  }, [stats]);

  const deviceMaximum = useMemo(() => {
    return Math.max(
      ...(stats?.device_breakdown.map(
        (item) => item.event_count,
      ) ?? [0]),
    );
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Platform activity and engagement analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : !stats ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Analytics unavailable
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            No analytics data could be loaded.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Events</p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {numberFormat(stats.total_events)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Today</p>

              <p className="mt-2 text-2xl font-semibold text-blue-700">
                {numberFormat(stats.events_today)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Last 7 Days</p>

              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {numberFormat(stats.events_last_7_days)}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Last 30 Days</p>

              <p className="mt-2 text-2xl font-semibold text-purple-700">
                {numberFormat(stats.events_last_30_days)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Unique Users</p>

              <p className="mt-2 text-2xl font-semibold text-amber-700">
                {numberFormat(stats.unique_users)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Unique Businesses
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {numberFormat(stats.unique_businesses)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Daily Events
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Event volume over the last 30 days.
                </p>
              </div>

              {stats.daily_events.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No daily event data available.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {stats.daily_events.map((item) => (
                    <div key={item.date}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {formatDate(item.date)}
                        </span>

                        <span className="font-medium text-slate-700">
                          {numberFormat(item.event_count)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800 transition-all"
                          style={{
                            width: getBarWidth(
                              item.event_count,
                              dailyMaximum,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Top Events
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Most frequently recorded event types.
                </p>
              </div>

              {stats.top_events.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No event data available.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {stats.top_events.map((item, index) => (
                    <div key={`${item.event_name}-${index}`}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-slate-600">
                          {item.event_name || "Unknown event"}
                        </span>

                        <span className="shrink-0 font-medium text-slate-700">
                          {numberFormat(item.event_count)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-700 transition-all"
                          style={{
                            width: getBarWidth(
                              item.event_count,
                              topEventMaximum,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Platform Breakdown
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Events grouped by recorded platform.
                </p>
              </div>

              {stats.platform_breakdown.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No platform data available.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {stats.platform_breakdown.map((item, index) => (
                    <div key={`${item.platform}-${index}`}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-600">
                          {item.platform || "Unknown"}
                        </span>

                        <span className="font-medium text-slate-700">
                          {numberFormat(item.event_count)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-700 transition-all"
                          style={{
                            width: getBarWidth(
                              item.event_count,
                              platformMaximum,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Device Breakdown
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Events grouped by recorded device type.
                </p>
              </div>

              {stats.device_breakdown.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No device data available.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {stats.device_breakdown.map((item, index) => (
                    <div key={`${item.device_type}-${index}`}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-600">
                          {item.device_type || "Unknown"}
                        </span>

                        <span className="font-medium text-slate-700">
                          {numberFormat(item.event_count)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-purple-700 transition-all"
                          style={{
                            width: getBarWidth(
                              item.event_count,
                              deviceMaximum,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}