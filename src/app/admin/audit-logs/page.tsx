import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLog = {
  id: string;
  profile_id: string | null;
  module_name: string;
  action_name: string;
  entity_name: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatJson(value: Record<string, unknown> | null) {
  if (!value) {
    return "â€”";
  }

  return JSON.stringify(value);
}

export default async function AdminAuditLogsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_audit_logs", {
    p_search: null,
    p_module_name: null,
    p_action_name: null,
    p_limit: 100,
    p_offset: 0,
  });

  const logs: AuditLog[] = Array.isArray(data)
    ? data.map((item) => ({
        id: String(item.id),
        profile_id: item.profile_id ? String(item.profile_id) : null,
        module_name: String(item.module_name),
        action_name: String(item.action_name),
        entity_name: item.entity_name
          ? String(item.entity_name)
          : null,
        entity_id: item.entity_id ? String(item.entity_id) : null,
        old_data:
          item.old_data &&
          typeof item.old_data === "object" &&
          !Array.isArray(item.old_data)
            ? (item.old_data as Record<string, unknown>)
            : null,
        new_data:
          item.new_data &&
          typeof item.new_data === "object" &&
          !Array.isArray(item.new_data)
            ? (item.new_data as Record<string, unknown>)
            : null,
        created_at: item.created_at ? String(item.created_at) : null,
      }))
    : [];

  const moduleCounts = logs.reduce<Record<string, number>>(
    (counts, log) => {
      counts[log.module_name] = (counts[log.module_name] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const actionCounts = logs.reduce<Record<string, number>>(
    (counts, log) => {
      counts[log.action_name] = (counts[log.action_name] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const topModules = Object.entries(moduleCounts)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 6);

  const topActions = Object.entries(actionCounts)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 6);

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          System
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Audit Logs
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Review privileged platform activity and administrative changes.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load audit logs. Please verify the admin audit logs RPC.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Audit Events
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {logs.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Modules
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {Object.keys(moduleCounts).length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Actions
          </p>

          <p className="mt-2 text-3xl font-extrabold">
            {Object.keys(actionCounts).length}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Activity by Module</h2>

          <div className="mt-5 space-y-3">
            {topModules.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No audit activity available.
              </p>
            ) : (
              topModules.map(([module, count]) => (
                <div
                  key={module}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-secondary)] px-4 py-3"
                >
                  <span className="text-sm font-medium">{module}</span>

                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Activity by Action</h2>

          <div className="mt-5 space-y-3">
            {topActions.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No audit activity available.
              </p>
            ) : (
              topActions.map(([action, count]) => (
                <div
                  key={action}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-secondary)] px-4 py-3"
                >
                  <span className="text-sm font-medium">{action}</span>

                  <span className="text-sm font-bold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="text-lg font-bold">Recent Audit Activity</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Latest administrative events recorded by Twimzi.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Module
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Action
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Entity
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Profile
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Changes
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {log.module_name}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold">
                        {log.action_name}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium">
                        {log.entity_name ?? "â€”"}
                      </p>

                      {log.entity_id ? (
                        <p className="mt-1 max-w-[220px] truncate font-mono text-[10px] text-[var(--color-text-muted)]">
                          {log.entity_id}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      {log.profile_id ? (
                        <p className="max-w-[220px] truncate font-mono text-[10px] text-[var(--color-text-muted)]">
                          {log.profile_id}
                        </p>
                      ) : (
                        <span className="text-sm text-[var(--color-text-muted)]">
                          System
                        </span>
                      )}
                    </td>

                    <td className="max-w-[360px] px-6 py-5">
                      {log.old_data || log.new_data ? (
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-[var(--color-primary)]">
                            View changes
                          </summary>

                          <div className="mt-3 space-y-2 text-[10px]">
                            {log.old_data ? (
                              <div>
                                <p className="font-bold text-[var(--color-text-muted)]">
                                  OLD
                                </p>

                                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-slate-100">
                                  {formatJson(log.old_data)}
                                </pre>
                              </div>
                            ) : null}

                            {log.new_data ? (
                              <div>
                                <p className="font-bold text-[var(--color-text-muted)]">
                                  NEW
                                </p>

                                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-slate-100">
                                  {formatJson(log.new_data)}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          No data snapshot
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-xs text-[var(--color-text-muted)]">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-lg font-bold">Security</h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Audit logs are exposed through a SUPER_ADMIN-protected RPC.
          Network-level fields such as IP addresses and user-agent strings are
          intentionally excluded from the browser response.
        </p>
      </section>
    </div>
  );
}
