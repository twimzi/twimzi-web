import Link from "next/link";
import { RegistrationLeadsTable, type RegistrationLead } from "@/components/admin/registration-leads-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Business = {
  id: string;
  name: string;
  status: string;
  verification_status: string;
  profile_completion: number | null;
  created_at: string;
  is_active: boolean;
};
type Activity = {
  event_name: string;
  created_at: string;
  path: string | null;
  step_name: string | null;
  source: string;
};
type RegistrationUser = {
  profile_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  account_status: string;
  created_at: string;
  last_seen: string | null;
  businesses: Business[];
  last_event: string | null;
  last_event_at: string | null;
  first_registration_at: string | null;
  event_count: number;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  recent_events: Activity[];
  pipeline_status: string;
};
type AnonymousSession = {
  session_id: string;
  first_seen: string;
  last_seen: string;
  event_count: number;
  last_event: string;
  last_path: string;
  source: string;
  campaign: string | null;
  registration_started: boolean;
  registration_submitted: boolean;
  event_history: { event_name: string; created_at: string; path: string | null; cta_label: string | null }[];
};
type Payload = {
  users: RegistrationUser[];
  anonymous_sessions: AnonymousSession[];
  summary: {
    total_accounts: number;
    accounts_30d: number;
    accounts_7d: number;
    businesses_total: number;
    businesses_30d: number;
    businesses_approved: number;
    registration_starts_30d: number;
    registration_submissions_30d: number;
    anonymous_registration_sessions: number;
  };
};

const nf = new Intl.NumberFormat("en-IN");
const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "—";

const statusLabel: Record<string, string> = {
  account_created: "Account only",
  draft: "Business draft",
  business_created: "Business created",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

function statusStyle(status: string) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "pending_approval") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "draft" || status === "account_created") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums">{nf.format(value)}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{note}</p>
    </div>
  );
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "all";
  const supabase = await createSupabaseServerClient();
  const [{ data, error }, { data: leadsData, error: leadsError }] = await Promise.all([
    supabase.rpc("admin_registration_intelligence"),
    supabase.rpc("admin_registration_leads"),
  ]);
  const payload = data as Payload | null;
  const leads = (Array.isArray(leadsData) ? leadsData : []) as RegistrationLead[];

  if (error || !payload?.summary) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Growth operations</p>
          <h1 className="mt-1 text-3xl font-extrabold">Registration CRM</h1>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">Registration intelligence could not load.</p>
          <p className="mt-1">{error?.message ?? "No data returned."}</p>
        </div>
      </div>
    );
  }

  const users = payload.users.filter((user) => {
    const matchesStatus = status === "all" || user.pipeline_status === status;
    const haystack = [user.full_name, user.email, user.phone, user.city, ...user.businesses.map((business) => business.name)]
      .filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });
  const startedSessions = payload.anonymous_sessions.filter((session) => session.registration_started);
  const abandonedSessions = startedSessions.filter((session) => !session.registration_submitted);

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Acquisition & onboarding operations</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Registration CRM</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-muted)]">
            See who created an account, which business they added, their latest recorded actions and which anonymous sessions began registration.
          </p>
        </div>
        <Link href="/admin/growth" className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold">Growth dashboard</Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total accounts" value={payload.summary.total_accounts} note="All non-deleted user profiles" />
        <Metric label="New accounts" value={payload.summary.accounts_30d} note={`${nf.format(payload.summary.accounts_7d)} in the last 7 days`} />
        <Metric label="Businesses" value={payload.summary.businesses_total} note={`${nf.format(payload.summary.businesses_approved)} approved`} />
        <Metric label="New businesses" value={payload.summary.businesses_30d} note="Created in the last 30 days" />
        <Metric label="Registration starts" value={payload.summary.registration_starts_30d} note="Tracked sessions in the last 30 days" />
        <Metric label="Submissions tracked" value={payload.summary.registration_submissions_30d} note="Tracked submit events in the last 30 days" />
        <Metric label="Anonymous starts" value={payload.summary.anonymous_registration_sessions} note="Sessions not yet linked to an account" />
        <Metric label="Potential follow-ups" value={abandonedSessions.length} note="Started registration without a recorded submission" />
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">Registered users & business pipeline</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Account records joined to business profiles and linked activity events.</p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">{nf.format(users.length)} records shown · maximum 250</span>
          </div>
          <form method="get" className="mt-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, phone or business" className="min-h-11 rounded-xl border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-primary)]" />
            <select name="status" defaultValue={status} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm">
              <option value="all">All pipeline stages</option>
              <option value="account_created">Account only</option>
              <option value="draft">Business draft</option>
              <option value="business_created">Business created</option>
              <option value="pending_approval">Pending approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="min-h-11 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white">Filter</button>
          </form>
        </div>

        {users.length === 0 ? (
          <p className="p-10 text-center text-sm text-[var(--color-text-muted)]">No registrations match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[var(--color-secondary)] text-xs text-[var(--color-text-muted)]">
                <tr>
                  <th className="px-5 py-3">Person / contact</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Pipeline</th>
                  <th className="px-4 py-3">Acquisition</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last recorded activity</th>
                  <th className="px-4 py-3">Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.profile_id} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-5 py-4">
                      <p className="font-bold">{user.full_name || "Unnamed user"}</p>
                      <a className="mt-1 block text-xs text-[var(--color-primary)]" href={`mailto:${user.email}`}>{user.email}</a>
                      {user.phone ? <a className="mt-1 block text-xs text-[var(--color-text-muted)]" href={`tel:${user.phone}`}>{user.phone}</a> : null}
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{[user.city, user.state].filter(Boolean).join(", ") || "Location not provided"}</p>
                    </td>
                    <td className="px-4 py-4">
                      {user.businesses.length ? user.businesses.map((business) => (
                        <div key={business.id} className="mb-2 last:mb-0">
                          <Link href={`/admin/businesses?search=${encodeURIComponent(business.name)}`} className="font-semibold text-[var(--color-primary)] hover:underline">{business.name}</Link>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{business.status} · {business.profile_completion ?? 0}% profile</p>
                        </div>
                      )) : <span className="text-xs text-[var(--color-text-muted)]">No business profile yet</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(user.pipeline_status)}`}>{statusLabel[user.pipeline_status] ?? user.pipeline_status}</span>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Account: {user.account_status}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{user.source ?? "Not attributed"}</p>
                      {user.campaign ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{user.campaign}</p> : null}
                      {user.medium ? <p className="text-xs text-[var(--color-text-muted)]">{user.medium}</p> : null}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{dateTime(user.created_at)}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{user.last_event ?? "No linked events"}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{dateTime(user.last_event_at)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <details className="max-w-xs">
                        <summary className="cursor-pointer font-semibold text-[var(--color-primary)]">{nf.format(user.event_count)} events · View</summary>
                        <ol className="mt-3 space-y-2 border-l border-[var(--color-border)] pl-3">
                          {user.recent_events.map((event, index) => (
                            <li key={`${event.created_at}-${index}`} className="text-xs">
                              <p className="font-semibold">{event.step_name ?? event.event_name}</p>
                              <p className="text-[var(--color-text-muted)]">{dateTime(event.created_at)} · {event.path ?? "—"}</p>
                            </li>
                          ))}
                        </ol>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="registration-leads" className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Registration leads & follow-ups</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Consent-based form details captured while visitors complete business registration.</p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">{leads.length} leads</span>
          </div>
          {leadsError ? <p className="mt-3 text-xs text-red-600">Lead list could not load: {leadsError.message}</p> : null}
        </div>
        <div className="p-5"><RegistrationLeadsTable initialLeads={leads} /></div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] p-5">
          <h2 className="font-bold">Anonymous registration sessions</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">These sessions started business registration before being linked to a signed-in profile. A session ID is not a person&apos;s identity.</p>
        </div>
        {startedSessions.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">No anonymous registration starts recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--color-secondary)] text-xs text-[var(--color-text-muted)]">
                <tr><th className="px-5 py-3">Session</th><th className="px-4 py-3">Source / campaign</th><th className="px-4 py-3">Last page</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3">First seen</th><th className="px-4 py-3">Last seen</th><th className="px-4 py-3">Journey</th></tr>
              </thead>
              <tbody>
                {startedSessions.map((session) => (
                  <tr key={session.session_id} className="border-t border-[var(--color-border)]">
                    <td className="px-5 py-4"><p className="font-semibold">{session.session_id.slice(0, 12)}…</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{session.event_count} events</p></td>
                    <td className="px-4 py-4">{session.source}{session.campaign ? <p className="text-xs text-[var(--color-text-muted)]">{session.campaign}</p> : null}</td>
                    <td className="px-4 py-4">{session.last_path}</td>
                    <td className="px-4 py-4"><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{session.registration_submitted ? "Submitted" : "Started · no submit"}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap">{dateTime(session.first_seen)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{dateTime(session.last_seen)}</td>
                    <td className="px-4 py-4">
                      <details className="max-w-xs">
                        <summary className="cursor-pointer font-semibold text-[var(--color-primary)]">View {session.event_count} events</summary>
                        <ol className="mt-3 space-y-2 border-l border-[var(--color-border)] pl-3">
                          {session.event_history.map((event, index) => (
                            <li key={`${event.created_at}-${index}`} className="text-xs">
                              <p className="font-semibold">{event.event_name}</p>
                              <p className="text-[var(--color-text-muted)]">{dateTime(event.created_at)} · {event.path ?? "—"}</p>
                              {event.cta_label ? <p className="text-[var(--color-text-muted)]">CTA: {event.cta_label}</p> : null}
                            </li>
                          ))}
                        </ol>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        Privacy note: identified user records are visible only through the authenticated Super Admin route. Anonymous sessions are shown as pseudonymous session IDs, not inferred identities. Historical events without profile linkage remain anonymous.
      </p>
    </div>
  );
}
