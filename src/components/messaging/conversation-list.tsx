"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ConversationSummary = {
  conversation_id: string;
  conversation_type: string;
  business_id: string | null;
  customer_profile_id: string | null;
  title: string | null;
  counterpart_profile_id: string | null;
  counterpart_name: string;
  counterpart_is_business: boolean;
  counterpart_business_name: string | null;
  counterpart_avatar_media_id: string | null;
  last_message_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

function formatConversationTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const difference = now.getTime() - date.getTime();

  if (difference >= 0 && difference < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], {
      weekday: "short",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function getDisplayName(item: ConversationSummary): string {
  return (
    item.counterpart_business_name ||
    item.title ||
    item.counterpart_name ||
    "Twimzi User"
  );
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "T";
}

export function ConversationList() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthenticated(false);
      setItems([]);
      setLoading(false);
      return;
    }

    setAuthenticated(true);

    const { data, error: queryError } = await supabase.rpc(
      "get_my_conversation_summaries",
    );

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as ConversationSummary[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        setAuthenticated(false);
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase.rpc(
        "get_my_conversation_summaries",
      );

      if (cancelled) {
        return;
      }

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setItems((data ?? []) as ConversationSummary[]);
      setLoading(false);
    };

    void initialize();

    const channel = supabase
      .channel("twimzi-conversation-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          void loadConversations();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [loadConversations, supabase]);

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-2xl">
          💬
        </div>

        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text)]">
          Messages
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          Sign in to view your conversations and communicate with businesses
          and other permitted Twimzi users.
        </p>

        <Link
          href="/login?next=/messages"
          className="mt-6 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/90 shadow-[0_16px_42px_rgba(24,45,100,0.09)] backdrop-blur">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--color-border)] bg-[linear-gradient(115deg,rgba(237,225,255,0.78),rgba(220,235,255,0.78),rgba(221,248,255,0.78))] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Conversations</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your latest chats and business enquiries</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-dark)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Private conversations
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 p-4 sm:p-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex animate-pulse gap-3 rounded-xl p-3"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-[var(--color-border)]" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-36 rounded bg-[var(--color-border)]" />
                <div className="mt-2 h-3 w-56 rounded bg-[var(--color-border)]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              Unable to load messages.
            </p>

            <p className="mt-1 break-words text-xs text-red-600">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadConversations();
            }}
            className="mt-4 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center sm:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-2xl">
            💬
          </div>

          <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">
            No conversations yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
            Start a conversation from a business profile on Twimzi.
          </p>

          <Link
            href="/businesses"
            className="mt-5 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            Explore businesses
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {items.map((item) => {
            const displayName = getDisplayName(item);
            const unreadCount = Number(item.unread_count) || 0;

            return (
              <Link
                key={item.conversation_id}
                href={`/messages/${item.conversation_id}`}
                className="group flex gap-3 px-4 py-4 transition duration-200 hover:bg-[linear-gradient(90deg,rgba(237,225,255,0.42),rgba(220,235,255,0.42),rgba(221,248,255,0.42))] sm:px-5"
              >
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#EDE1FF_0%,#DCEBFF_55%,#DDF8FF_100%)] text-sm font-bold text-[var(--color-primary-dark)] ring-1 ring-white shadow-sm transition group-hover:scale-105">
                    {getInitial(displayName)}
                  </div>

                  {unreadCount > 0 ? (
                    <span
                      aria-label={`${unreadCount} unread messages`}
                      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8E07FB,#1879FD)] px-1.5 text-[10px] font-bold text-white ring-2 ring-white"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`truncate text-sm ${
                        unreadCount > 0
                          ? "font-bold text-[var(--color-text)]"
                          : "font-semibold text-[var(--color-text)]"
                      }`}
                    >
                      {displayName}
                    </p>

                    <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                      {formatConversationTime(item.last_message_at)}
                    </span>
                  </div>

                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    <p
                      className={`truncate text-sm ${
                        unreadCount > 0
                          ? "font-medium text-[var(--color-text-secondary)]"
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {item.last_message || "Start the conversation"}
                    </p>
                  </div>

                  {item.counterpart_is_business ? (
                    <p className="mt-1 text-xs text-[var(--color-primary)]">
                      Business
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}