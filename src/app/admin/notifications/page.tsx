import { createSupabaseServerClient } from "@/lib/supabase/server";

type Notification = {
  id: string;
  recipient_profile_id: string;
  notification_type: string;
  title: string;
  message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean | null;
  is_sent: boolean | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string | null;
  sender_profile_id: string | null;
  priority: number | null;
  image_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action_type: string | null;
  action_value: string | null;
  metadata: Record<string, unknown> | null;
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

function statusBadge(
  condition: boolean,
  positive: string,
  negative: string,
) {
  return condition ? (
    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      {positive}
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {negative}
    </span>
  );
}

export default async function AdminNotificationsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_notifications", {
    p_search: null,
    p_notification_type: null,
    p_limit: 100,
    p_offset: 0,
  });

  const notifications: Notification[] = Array.isArray(data)
    ? data.map((item) => ({
        id: String(item.id),
        recipient_profile_id: String(item.recipient_profile_id),
        notification_type: String(item.notification_type),
        title: String(item.title),
        message: item.message ? String(item.message) : null,
        reference_type: item.reference_type
          ? String(item.reference_type)
          : null,
        reference_id: item.reference_id
          ? String(item.reference_id)
          : null,
        is_read: item.is_read === null ? null : Boolean(item.is_read),
        is_sent: item.is_sent === null ? null : Boolean(item.is_sent),
        sent_at: item.sent_at ? String(item.sent_at) : null,
        read_at: item.read_at ? String(item.read_at) : null,
        created_at: item.created_at ? String(item.created_at) : null,
        sender_profile_id: item.sender_profile_id
          ? String(item.sender_profile_id)
          : null,
        priority:
          item.priority === null ? null : Number(item.priority),
        image_url: item.image_url ? String(item.image_url) : null,
        entity_type: item.entity_type
          ? String(item.entity_type)
          : null,
        entity_id: item.entity_id ? String(item.entity_id) : null,
        action_type: item.action_type
          ? String(item.action_type)
          : null,
        action_value: item.action_value
          ? String(item.action_value)
          : null,
        metadata:
          item.metadata &&
          typeof item.metadata === "object" &&
          !Array.isArray(item.metadata)
            ? (item.metadata as Record<string, unknown>)
            : null,
      }))
    : [];

  const unreadCount = notifications.filter(
    (notification) => notification.is_read === false,
  ).length;

  const sentCount = notifications.filter(
    (notification) => notification.is_sent === true,
  ).length;

  const pendingCount = notifications.filter(
    (notification) => notification.is_sent !== true,
  ).length;

  const typeCounts = notifications.reduce<Record<string, number>>(
    (counts, notification) => {
      counts[notification.notification_type] =
        (counts[notification.notification_type] ?? 0) + 1;

      return counts;
    },
    {},
  );

  const topTypes = Object.entries(typeCounts)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 5);

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          System
        </p>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Notifications
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Monitor platform notifications, delivery status, and notification
          activity.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load notifications. Please verify the admin notifications
          RPC.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Notifications
          </p>
          <p className="mt-2 text-3xl font-extrabold">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Sent
          </p>
          <p className="mt-2 text-3xl font-extrabold">{sentCount}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Pending
          </p>
          <p className="mt-2 text-3xl font-extrabold">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="text-sm text-[var(--color-text-muted)]">
            Unread
          </p>
          <p className="mt-2 text-3xl font-extrabold">{unreadCount}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">Notification Types</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Distribution of currently recorded notification types.
          </p>

          {topTypes.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[var(--color-secondary)] p-6 text-center text-sm text-[var(--color-text-muted)]">
              No notification data available.
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {topTypes.map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-secondary)] px-4 py-3"
                >
                  <span className="truncate text-sm font-medium">
                    {type}
                  </span>

                  <span className="ml-4 text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="text-lg font-bold">Delivery</h2>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  Sent
                </span>
                <span className="font-bold">{sentCount}</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{
                    width: `${
                      notifications.length
                        ? Math.round(
                            (sentCount / notifications.length) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  Pending
                </span>
                <span className="font-bold">{pendingCount}</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{
                    width: `${
                      notifications.length
                        ? Math.round(
                            (pendingCount / notifications.length) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="text-lg font-bold">Recent Notifications</h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Latest notification records available to Super Admin.
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
            No notifications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Notification
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Delivery
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Read
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-6 py-5">
                      <p className="max-w-md font-semibold">
                        {notification.title}
                      </p>

                      {notification.message ? (
                        <p className="mt-1 max-w-lg truncate text-xs text-[var(--color-text-muted)]">
                          {notification.message}
                        </p>
                      ) : null}

                      <p className="mt-2 font-mono text-[10px] text-[var(--color-text-muted)]">
                        {notification.id}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {notification.notification_type}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold">
                      {notification.priority ?? "â€”"}
                    </td>

                    <td className="px-6 py-5">
                      {statusBadge(
                        notification.is_sent === true,
                        "Sent",
                        "Pending",
                      )}
                    </td>

                    <td className="px-6 py-5">
                      {notification.is_read === true
                        ? statusBadge(true, "Read", "Unread")
                        : statusBadge(false, "Read", "Unread")}
                    </td>

                    <td className="px-6 py-5 text-xs text-[var(--color-text-muted)]">
                      {formatDate(notification.created_at)}
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
          Notification records are read through a SUPER_ADMIN-protected
          Supabase RPC. Recipient, sender, reference, and metadata identifiers
          remain server-side controlled and are not queried directly from the
          browser.
        </p>
      </section>
    </div>
  );
}
