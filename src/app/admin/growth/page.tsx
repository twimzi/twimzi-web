import Link from "next/link";
import { CampaignLinkBuilder } from "@/components/admin/growth/campaign-link-builder";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GrowthSummary = {
  total_events: number;
  unique_visitors: number;
  page_views: number;
  registration_views: number;
  registration_starts: number;
  registration_submissions: number;
  whatsapp_clicks: number;
  signup_completions: number;
  new_businesses_30d: number;
  new_users_30d: number;
  total_businesses: number;
  approved_businesses: number;
  draft_businesses: number;
};

type FunnelStage = { stage: string; label: string; sessions: number };
type DailyRow = {
  date: string;
  visitors: number;
  registrations: number;
  whatsapp_clicks: number;
};
type CampaignRow = {
  source: string;
  campaign: string;
  visitors: number;
  registrations: number;
};
type PageRow = { path: string; views: number; visitors: number };

type GrowthDashboard = {
  summary: GrowthSummary;
  funnel: FunnelStage[];
  daily: DailyRow[];
  campaigns: CampaignRow[];
  top_pages: PageRow[];
};

function number(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value + "T00:00:00"));
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
        {number(value)}
      </p>
      {note ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{note}</p> : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h2 className="font-bold text-[var(--color-text)]">{title}</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default async function AdminGrowthPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_growth_dashboard_stats");
  const growth = (data ?? null) as GrowthDashboard | null;

  if (error || !growth?.summary) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Growth</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[var(--color-text)]">Growth Dashboard</h1>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Growth data is not available yet.</p>
          <p className="mt-1">
            Apply the Twimzi Growth System database migration before enabling this dashboard.
          </p>
          {error?.message ? <p className="mt-2 text-xs">{error.message}</p> : null}
        </div>
      </div>
    );
  }

  const summary = growth.summary;
  const funnelBase = Math.max(1, growth.funnel[0]?.sessions ?? 0);
  const maxDaily = Math.max(1, ...growth.daily.map((item) => item.visitors));

  return (
    <div className="space-y-7 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Acquisition & conversion</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Growth Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Website activity, business onboarding and campaign performance over the last 30 days.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]"
        >
          Platform analytics
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Unique visitors" value={summary.unique_visitors} note="Tracked browser sessions" />
        <Metric label="Page views" value={summary.page_views} note="Last 30 days" />
        <Metric label="Business registrations" value={summary.registration_submissions} note="Successful submissions" />
        <Metric label="WhatsApp outbound clicks" value={summary.whatsapp_clicks} note="Website-to-WhatsApp actions" />
        <Metric label="Registration starts" value={summary.registration_starts} />
        <Metric label="Accounts created" value={summary.signup_completions} note="Successful sign-up submissions" />
        <Metric label="New businesses" value={summary.new_businesses_30d} note="Created in last 30 days" />
        <Metric label="New user accounts" value={summary.new_users_30d} note="Created in last 30 days" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Business registration funnel"
          description="Distinct sessions at each onboarding stage. Funnel tracking begins when this release is deployed."
        >
          {growth.funnel.length === 0 || growth.funnel.every((stage) => stage.sessions === 0) ? (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No registration funnel activity recorded yet.
            </p>
          ) : (
            <div className="space-y-5">
              {growth.funnel.map((stage) => (
                <div key={stage.stage}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[var(--color-text-secondary)]">{stage.label}</span>
                    <span className="font-bold tabular-nums text-[var(--color-text)]">{number(stage.sessions)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{ width: Math.min(100, (stage.sessions / funnelBase) * 100) + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-5 text-xs text-[var(--color-text-muted)]">
            Existing historical events without a session identifier are excluded from session conversion rates.
          </p>
        </Section>

        <Section title="Business pipeline" description="Current platform business records and 30-day acquisition.">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[var(--color-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Total businesses</p>
              <p className="mt-1 text-2xl font-bold">{number(summary.total_businesses)}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Approved</p>
              <p className="mt-1 text-2xl font-bold">{number(summary.approved_businesses)}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">Draft / pending</p>
              <p className="mt-1 text-2xl font-bold">{number(summary.draft_businesses)}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">All recorded events</p>
              <p className="mt-1 text-2xl font-bold">{number(summary.total_events)}</p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="WhatsApp campaign link builder" description="Create tagged links for outreach messages so registrations can be attributed to each campaign.">
        <CampaignLinkBuilder />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Daily visitors" description="Unique tracked sessions by day, over the last 14 days.">
          {growth.daily.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">No daily activity yet.</p>
          ) : (
            <div className="space-y-3">
              {growth.daily.map((item) => (
                <div key={item.date}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">{dateLabel(item.date)}</span>
                    <span className="font-semibold tabular-nums">{number(item.visitors)} visitors · {number(item.registrations)} registrations</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                    <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: Math.max(2, (item.visitors / maxDaily) * 100) + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Campaign performance" description="UTM campaign attribution and completed business registrations.">
          {growth.campaigns.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              No tagged campaign activity yet. Use UTM links in WhatsApp campaigns.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                    <th className="pb-3 pr-3 font-semibold">Source / campaign</th>
                    <th className="pb-3 pr-3 text-right font-semibold">Visitors</th>
                    <th className="pb-3 text-right font-semibold">Registrations</th>
                  </tr>
                </thead>
                <tbody>
                  {growth.campaigns.map((item) => (
                    <tr key={item.source + "-" + item.campaign} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{item.source}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.campaign}</p>
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">{number(item.visitors)}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{number(item.registrations)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      <Section title="Most visited pages" description="Page paths with the most tracked views during the last 30 days.">
        {growth.top_pages.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Page views will appear after tracking is enabled.</p>
        ) : (
          <div className="space-y-3">
            {growth.top_pages.map((item) => (
              <div key={item.path} className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <span className="min-w-0 truncate text-sm font-medium">{item.path}</span>
                <span className="shrink-0 text-sm tabular-nums text-[var(--color-text-muted)]">
                  {number(item.views)} views · {number(item.visitors)} visitors
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        Measurement uses first-party, session-scoped identifiers and campaign tags. No IP address, email address, phone number or raw user-agent is collected by this web tracker.
      </p>
    </div>
  );
}
