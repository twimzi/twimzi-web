"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  recipient_profile_id: string | null;
  notification_type: string | null;
  title: string | null;
  message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  is_sent: boolean;
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

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNotificationType(value: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function priorityClasses(priority: number | null) {
  if (priority === null || priority === undefined) {
    return "bg-slate-100 text-slate-600";
  }

  if (priority >= 3) {
    return "bg-red-50 text-red-700";
  }

  if (priority === 2) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function truncateId(value: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function AdminNotificationsPage() {
  const supabase = createSupabaseBrowserClient();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
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

      const { data, error: notificationError } = await supabase.rpc(
        "admin_get_notifications",
        {
          p_search: submittedSearch.trim() || null,
          p_notification_type: notificationType || null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (notificationError) {
        throw notificationError;
      }

      setItems((data ?? []) as NotificationItem[]);
    } catch (err) {
      setItems([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [notificationType, submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadNotifications]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearFilters() {
    setSearch("");
    setSubmittedSearch("");
    setNotificationType("");
  }

  const statistics = useMemo(() => {
    return {
      total: items.length,
      unread: items.filter((item) => !item.is_read).length,
      read: items.filter((item) => item.is_read).length,
      sent: items.filter((item) => item.is_sent).length,
      unsent: items.filter((item) => !item.is_sent).length,
      highPriority: items.filter(
        (item) => (item.priority ?? 0) >= 3,
      ).length,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Notifications
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review notification delivery and recipient activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Unread</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statistics.unread}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Read</p>

          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {statistics.read}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sent</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {statistics.sent}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Unsent</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {statistics.unsent}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">High Priority</p>

          <p className="mt-2 text-2xl font-semibold text-red-700">
            {statistics.highPriority}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 xl:flex-row"
        >
          <div className="flex-1">
            <label
              htmlFor="notification-search"
              className="sr-only"
            >
              Search notifications
            </label>

            <input
              id="notification-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, message or notification type..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <select
            value={notificationType}
            onChange={(event) =>
              setNotificationType(event.target.value)
            }
            aria-label="Filter notification type"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">All notification types</option>
            <option value="system">System</option>
            <option value="business">Business</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="offer">Offer</option>
            <option value="post">Post</option>
            <option value="community">Community</option>
            <option value="message">Message</option>
            <option value="follow">Follow</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {(submittedSearch || notificationType) && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Notification Log
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest notifications are shown first.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              N
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No notifications found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch || notificationType
                ? "No notifications match the selected filters."
                : "There are currently no notifications available."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Notification</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-md px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {item.title || "Untitled notification"}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {item.message || "No message"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {formatNotificationType(
                            item.notification_type,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          {truncateId(item.recipient_profile_id)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClasses(
                            item.priority,
                          )}`}
                        >
                          {item.priority ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.is_sent
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.is_sent ? "Sent" : "Unsent"}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.is_read
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.is_read ? "Read" : "Unread"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {items.map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {item.title || "Untitled notification"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatNotificationType(
                          item.notification_type,
                        )}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${priorityClasses(
                        item.priority,
                      )}`}
                    >
                      P{item.priority ?? 0}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {item.message || "No message"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.is_sent
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.is_sent ? "Sent" : "Unsent"}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.is_read
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.is_read ? "Read" : "Unread"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <p>
                      Recipient:{" "}
                      <span className="font-mono">
                        {truncateId(item.recipient_profile_id)}
                      </span>
                    </p>

                    <p>
                      Created: {formatDateTime(item.created_at)}
                    </p>

                    <p>
                      Sent: {formatDateTime(item.sent_at)}
                    </p>

                    <p>
                      Read: {formatDateTime(item.read_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
              Showing {items.length} notification
              {items.length === 1 ? "" : "s"}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}