import { createSupabaseServerClient } from "@/lib/supabase/server";

type TopEvent = {
  event_name: string;
  event_count: number;
};

type BreakdownItem = {
  platform?: string;
  device_type?: string;
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
  platform_breakdown: BreakdownItem[];
  device_breakdown: BreakdownItem[];
  daily_events: DailyEvent[];
};

const DEFAULT_STATS: AnalyticsStats = {
  total_events: 0,
  events_today: 0,
  events_last_7_days: 0,
  events_last_30_days: 0,
  unique_users: 0,
  unique_businesses: 0,
  top_events: [],
  platform_breakdown: [],
  device_breakdown: [],
  daily_events: [],
};

function number(value: unknown) {
  return Number(value ?? 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function percentage(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default async function AdminAnalytics() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_analytics_stats");

  const raw = (data ?? {}) as Partial<AnalyticsStats>;

  const stats: AnalyticsStats = {
    total_events: number(raw.total_events),
    events_today: number(raw.events_today),
    events_last_7_days: number(raw.events_last_7_days),
    events_last_30_days: number(raw.events_last_30_days),
    unique_users: number(raw.unique_users),
    unique_businesses: number(raw.unique_businesses),
    top_events: Array.isArray(raw.top_events)
      ? raw.top_events.map((item) => ({
          event_name: String(item.event_name ?? "Unknown"),
          event_count: number(item.event_count),
        }))
      : DEFAULT_STATS.top_events,
    platform_breakdown: Array.isArray(raw.platform_breakdown)
      ? raw.platform_breakdown.map((item) => ({
          platform: String(item.platform ?? "Unknown"),
          event_count: number(item.event_count),
        }))
      : DEFAULT_STATS.platform_breakdown,
    device_breakdown: Array.isArray(raw.device_breakdown)
      ? raw.device_breakdown.map((item) => ({
          device_type: String(item.device_type ?? "Unknown"),
          event_count: number(item.event_count),
        }))
      : DEFAULT_STATS.device_breakdown,
    daily_events: Array.isArray(raw.daily_events)
      ? raw.daily_events.map((item) => ({
          date: String(item.date),
          event_count: number(item.event_count),
        }))
      : DEFAULT_STATS.daily_events,
  };

  const maxDailyEvents = Math.max(
    ...stats.daily_events.map((item) => item.event_count),
    1,
  );

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Growth
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Platform activity and engagement overview from Twimzi analytics
          events.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load analytics statistics. Please verify the admin
          analytics RPC configuration.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Total Events", stats.total_events, "All recorded events"],
          ["Events Today", stats.events_today, "Since midnight"],
          [
            "Last 7 Days",
            stats.events_last_7_days,
            "Recent platform activity",
          ],
          [
            "Last 30 Days",
            stats.events_last_30_days,
            "Recent monthly activity",
          ],
          ["Unique Users", stats.unique_users, "Users generating events"],
          [
            "Unique Businesses",
            stats.unique_businesses,
            "Businesses generating events",
          ],
        ].map(([label, value, description]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
          >
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              {label}
            </p>

            <p className="mt-2 text-3xl font-extrabold tracking-tight">
              {formatNumber(Number(value))}
            </p>

            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {description}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold">Platform Activity</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Daily analytics events for the last 30 days.
            </p>
          </div>

          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            30 Days
          </span>
        </div>

        {stats.daily_events.length === 0 ? (
          <div className="mt-8 rounded-xl bg-[var(--color-secondary)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No analytics activity recorded yet.
          </div>
        ) : (
          <div className="mt-8 flex h-64 items-end gap-1 overflow-x-auto pb-8">
            {stats.daily_events.map((item) => {
              const height = Math.max(
                Math.round((item.event_count / maxDailyEvents) * 180),
                4,
              );

              return (
                <div
                  key={item.date}
                  className="group flex min-w-7 flex-1 flex-col items-center justify-end"
                  title={`${formatDate(item.date)}: ${formatNumber(item.event_count)} events`}
                >
                  <span className="mb-2 hidden whitespace-nowrap text-[10px] font-semibold text-[var(--color-text-muted)] group-hover:block">
                    {formatNumber(item.event_count)}
                  </span>

                  <div
                    className="w-full min-w-2 rounded-t-md bg-[var(--color-primary)] transition-opacity group-hover:opacity-70"
                    style={{ height: `${height}px` }}
                  />

                  <span className="mt-2 whitespace-nowrap text-[9px] text-[var(--color-text-muted)]">
                    {formatDate(item.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Top Events</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Most frequently recorded event types.
          </p>

          <div className="mt-6 space-y-4">
            {stats.top_events.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No event data available.
              </p>
            ) : (
              stats.top_events.map((event, index) => (
                <div key={`${event.event_name}-${index}`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium">
                      {event.event_name}
                    </p>

                    <p className="shrink-0 text-sm font-bold">
                      {formatNumber(event.event_count)}
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{
                        width: `${percentage(
                          event.event_count,
                          stats.top_events[0]?.event_count ?? 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Platforms</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Event distribution by platform.
          </p>

          <div className="mt-6 space-y-4">
            {stats.platform_breakdown.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No platform data available.
              </p>
            ) : (
              stats.platform_breakdown.map((item, index) => (
                <div
                  key={`${item.platform}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-secondary)] px-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {item.platform}
                  </span>

                  <span className="text-sm font-bold">
                    {formatNumber(item.event_count)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Devices</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Event distribution by device type.
          </p>

          <div className="mt-6 space-y-4">
            {stats.device_breakdown.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No device data available.
              </p>
            ) : (
              stats.device_breakdown.map((item, index) => (
                <div
                  key={`${item.device_type}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-secondary)] px-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {item.device_type}
                  </span>

                  <span className="text-sm font-bold">
                    {formatNumber(item.event_count)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-bold">Analytics Architecture</h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Analytics data is read through the protected SUPER_ADMIN RPC. The
          dashboard does not expose sensitive analytics fields such as IP
          addresses or user-agent data to the browser.
        </p>
      </section>
    </div>
  );
}
