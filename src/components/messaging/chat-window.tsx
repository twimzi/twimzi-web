"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_profile_id: string | null;
  message_type: string | null;
  message: string | null;
  reply_to_message_id: string | null;
  is_edited: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  deleted_at: string | null;
  deleted_for_everyone: boolean;
  metadata: Record<string, unknown>;
  is_system_message: boolean;
  delivered_at: string | null;
  read_at: string | null;
};

type ChatWindowProps = {
  conversationId: string;
};

type ConversationHeader = {
  conversation_id: string;
  title: string | null;
  counterpart_name: string;
  counterpart_business_name: string | null;
  counterpart_is_business: boolean;
};

function formatMessageTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function getDisplayName(header: ConversationHeader): string {
  return (
    header.counterpart_business_name ||
    header.title ||
    header.counterpart_name ||
    "Twimzi User"
  );
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [header, setHeader] = useState<ConversationHeader | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    [],
  );

  const loadChat = useCallback(async () => {
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in to view this conversation.");
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select(
        `
          id,
          conversation_id,
          sender_profile_id,
          message_type,
          message,
          reply_to_message_id,
          is_edited,
          created_at,
          updated_at,
          status,
          deleted_at,
          deleted_for_everyone,
          metadata,
          is_system_message,
          delivered_at,
          read_at
        `,
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (messageError) {
      setError(messageError.message);
      setLoading(false);
      return;
    }

    const { data: summaryData, error: summaryError } = await supabase.rpc(
      "get_my_conversation_summaries",
    );

    if (summaryError) {
      setError(summaryError.message);
      setLoading(false);
      return;
    }

    const conversation = (
      (summaryData ?? []) as Array<{
        conversation_id: string;
        title: string | null;
        counterpart_name: string;
        counterpart_business_name: string | null;
        counterpart_is_business: boolean;
      }>
    ).find((item) => item.conversation_id === conversationId);

    if (!conversation) {
      setError("Conversation not found or you do not have access to it.");
      setLoading(false);
      return;
    }

    const loadedMessages = (messageData ?? []) as Message[];

    setMessages(loadedMessages);
    setHeader(conversation);
    setLoading(false);

    const unreadMessages = loadedMessages.filter(
      (message) =>
        message.sender_profile_id !== user.id && !message.deleted_at,
    );

    for (const message of unreadMessages) {
      await supabase.rpc("mark_message_read", {
        p_message_id: message.id,
      });
    }
  }, [conversationId, supabase]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      await loadChat();

      if (cancelled) {
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) {
          scrollToBottom("auto");
        }
      }, 0);
    };

    void initialize();

    const channel = supabase
      .channel(`twimzi-chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const incoming = payload.new as Message;

          if (incoming.deleted_at) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [...current, incoming];
          });

          if (incoming.sender_profile_id !== currentUserId) {
            await supabase.rpc("mark_message_read", {
              p_message_id: incoming.id,
            });
          }

          window.setTimeout(() => {
            scrollToBottom();
          }, 0);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [
    conversationId,
    currentUserId,
    loadChat,
    scrollToBottom,
    supabase,
  ]);

  useEffect(() => {
    window.setTimeout(() => {
      scrollToBottom("auto");
    }, 0);
  }, [messages.length, scrollToBottom]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setError("");

    const clientMessageId = crypto.randomUUID();

    const { data: messageId, error: sendError } = await supabase.rpc(
      "send_message",
      {
        p_conversation_id: conversationId,
        p_message: trimmed,
        p_message_type: "text",
        p_reply_to_message_id: null,
        p_client_message_id: clientMessageId,
        p_metadata: {},
      },
    );

    if (sendError) {
      setError(sendError.message);
      setSending(false);
      return;
    }

    setText("");
    setSending(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    if (messageId) {
      const { data: sentMessage } = await supabase
        .from("messages")
        .select(
          `
            id,
            conversation_id,
            sender_profile_id,
            message_type,
            message,
            reply_to_message_id,
            is_edited,
            created_at,
            updated_at,
            status,
            deleted_at,
            deleted_for_everyone,
            metadata,
            is_system_message,
            delivered_at,
            read_at
          `,
        )
        .eq("id", messageId)
        .maybeSingle();

      if (sentMessage) {
        setMessages((current) => {
          if (current.some((message) => message.id === sentMessage.id)) {
            return current;
          }

          return [...current, sentMessage as Message];
        });
      }
    }

    window.setTimeout(() => {
      scrollToBottom();
    }, 0);
  };

  const handleTextareaInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setText(event.target.value);

    const textarea = event.currentTarget;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  };

  if (loading) {
    return (
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-border)]" />

          <div>
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-border)]" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[var(--color-secondary)]" />
          </div>
        </div>

        <div className="flex-1 space-y-4 bg-[var(--color-secondary)] p-5">
          <div className="h-10 w-48 animate-pulse rounded-2xl bg-white" />
          <div className="ml-auto h-10 w-56 animate-pulse rounded-2xl bg-[var(--color-primary-light)]" />
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-white" />
        </div>
      </section>
    );
  }

  if (error && !header) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <Link
          href="/messages"
          className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary-dark)]"
        >
          ← Back to messages
        </Link>

        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            Unable to open conversation
          </p>

          <p className="mt-1 break-words text-xs text-red-600">{error}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadChat();
          }}
          className="mt-4 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]"
        >
          Retry
        </button>
      </section>
    );
  }

  const displayName = header ? getDisplayName(header) : "Conversation";

  return (
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 py-3 sm:px-5">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[var(--color-text-muted)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]"
        >
          ←
        </Link>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary-dark)]">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-[var(--color-text)]">
            {displayName}
          </h1>

          <p className="text-xs text-[var(--color-text-muted)]">
            {header?.counterpart_is_business ? "Business" : "Twimzi User"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[var(--color-secondary)] px-3 py-5 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex min-h-[480px] items-center justify-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                💬
              </div>

              <h2 className="mt-4 text-base font-semibold text-[var(--color-text)]">
                Start the conversation
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                Send a message to begin chatting.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const messageDate = formatMessageDate(message.created_at);

              const previousMessage =
                index > 0 ? messages[index - 1] : null;

              const previousMessageDate = previousMessage
                ? formatMessageDate(previousMessage.created_at)
                : "";

              const showDate = messageDate !== previousMessageDate;

              const isMine = message.sender_profile_id === currentUserId;

              const isDeleted =
                message.deleted_at !== null ||
                message.deleted_for_everyone;

              return (
                <div key={message.id}>
                  {showDate ? (
                    <div className="my-5 text-center">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] shadow-sm">
                        {messageDate}
                      </span>
                    </div>
                  ) : null}

                  <div
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] ${
                        isMine
                          ? "rounded-br-md bg-[var(--color-primary)] text-white"
                          : "rounded-bl-md border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                      }`}
                    >
                      {isDeleted ? (
                        <p
                          className={`text-sm italic ${
                            isMine
                              ? "text-white/70"
                              : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          Message deleted
                        </p>
                      ) : message.message_type !== "text" ? (
                        <p className="text-sm">
                          {message.message || "Unsupported message"}
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-5">
                          {message.message}
                        </p>
                      )}

                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isMine
                            ? "text-white/70"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        <span>{formatMessageTime(message.created_at)}</span>

                        {isMine ? (
                          <span
                            aria-label={
                              message.read_at
                                ? "Read"
                                : message.delivered_at
                                  ? "Delivered"
                                  : "Sent"
                            }
                          >
                            {message.read_at
                              ? "✓✓"
                              : message.delivered_at
                                ? "✓✓"
                                : "✓"}
                          </span>
                        ) : null}

                        {message.is_edited ? (
                          <span>edited</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error ? (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : null}

      <form
        onSubmit={sendMessage}
        className="border-t border-[var(--color-border)] bg-white p-3 sm:p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaInput}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (text.trim() && !sending) {
                  event.currentTarget.form?.requestSubmit();
                }
              }
            }}
            rows={1}
            maxLength={10000}
            placeholder="Write a message..."
            disabled={sending}
            className="max-h-[140px] min-h-[44px] flex-1 resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? "…" : "➤"}
          </button>
        </div>

        <p className="mt-2 px-1 text-[10px] text-[var(--color-text-muted)]">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </section>
  );
}