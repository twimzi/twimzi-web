"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BusinessPost = {
  id: string;
  business_id: string;
  category_id: string | null;
  post_type: string | null;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
};

type BusinessPostCardProps = {
  post: BusinessPost;
};

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8-8h.5a8.48 8.48 0 0 1 8 8v.5Z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 6l-4-4-4 4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v14"
      />
    </svg>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17v4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4h10l-1.5 5.5L18 13v1H6v-1l2.5-3.5L7 4Z"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m12 2.5 2.94 5.95 6.56.95-4.75 4.63 1.12 6.53L12 17.47l-5.87 3.09 1.12-6.53L2.5 9.4l6.56-.95L12 2.5Z" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BusinessPostCard({
  post,
}: BusinessPostCardProps) {
  const router = useRouter();

  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saveCount, setSaveCount] = useState(post.save_count ?? 0);
  const [shareCount, setShareCount] = useState(post.share_count ?? 0);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const postUrl = `/businesses/${post.business_id}?post=${encodeURIComponent(
    post.id,
  )}`;

  useEffect(() => {
    let cancelled = false;

    async function loadInteractionState() {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      const [{ data: savedData }, { data: likeData }] =
        await Promise.all([
          supabase.rpc("is_business_post_saved", {
            p_post_id: post.id,
          }),
          supabase
            .from("business_post_likes")
            .select("post_id")
            .eq("post_id", post.id)
            .eq("profile_id", user.id)
            .maybeSingle(),
        ]);

      if (cancelled) {
        return;
      }

      setSaved(savedData === true);
      setLiked(Boolean(likeData));
    }

    void loadInteractionState();

    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function requireUser() {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(postUrl)}`,
      );

      return null;
    }

    return user;
  }

  async function refreshCounts() {
    const supabase = createSupabaseBrowserClient();

    const [
      { data: latestLikeCount },
      { data: latestSaveCount },
      { data: latestShareCount },
    ] = await Promise.all([
      supabase.rpc("get_business_post_likes_count", {
        p_post_id: post.id,
      }),
      supabase.rpc("get_business_post_save_count", {
        p_post_id: post.id,
      }),
      supabase.rpc("get_business_post_share_count", {
        p_post_id: post.id,
      }),
    ]);

    if (typeof latestLikeCount === "number") {
      setLikeCount(latestLikeCount);
    }

    if (typeof latestSaveCount === "number") {
      setSaveCount(latestSaveCount);
    }

    if (typeof latestShareCount === "number") {
      setShareCount(latestShareCount);
    }
  }

  async function handleLike() {
    if (likeLoading) {
      return;
    }

    setLikeLoading(true);
    setMessage(null);

    try {
      const user = await requireUser();

      if (!user) {
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (liked) {
        const { error } = await supabase.rpc(
          "unlike_business_post",
          {
            p_post_id: post.id,
            p_profile_id: user.id,
          },
        );

        if (error) {
          throw error;
        }

        setLiked(false);
      } else {
        const { error } = await supabase.rpc(
          "like_business_post",
          {
            p_post_id: post.id,
            p_profile_id: user.id,
          },
        );

        if (error) {
          throw error;
        }

        setLiked(true);
      }

      await refreshCounts();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update like.",
      );
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleSave() {
    if (saveLoading) {
      return;
    }

    setSaveLoading(true);
    setMessage(null);

    try {
      const user = await requireUser();

      if (!user) {
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (saved) {
        const { error } = await supabase.rpc(
          "unsave_business_post",
          {
            p_post_id: post.id,
          },
        );

        if (error) {
          throw error;
        }

        setSaved(false);
      } else {
        const { error } = await supabase.rpc(
          "save_business_post",
          {
            p_post_id: post.id,
          },
        );

        if (error) {
          throw error;
        }

        setSaved(true);
      }

      await refreshCounts();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update saved status.",
      );
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleShare() {
    if (shareLoading) {
      return;
    }

    setShareLoading(true);
    setMessage(null);

    try {
      const absoluteUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${postUrl}`
          : postUrl;

      const shareTitle =
        post.title?.trim() || "Business update on Twimzi";

      const shareText =
        post.short_description?.trim() ||
        post.description?.trim() ||
        shareTitle;

      let shared = false;

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: absoluteUrl,
          });

          shared = true;
        } catch (caughtError) {
          if (
            caughtError instanceof DOMException &&
            caughtError.name === "AbortError"
          ) {
            return;
          }
        }
      }

      if (!shared) {
        if (
          typeof navigator === "undefined" ||
          !navigator.clipboard
        ) {
          throw new Error(
            "Sharing is not supported by this browser.",
          );
        }

        await navigator.clipboard.writeText(absoluteUrl);

        setMessage("Post link copied.");
        shared = true;
      }

      if (shared) {
        const supabase = createSupabaseBrowserClient();

        const { error } = await supabase.rpc(
          "share_business_post",
          {
            p_post_id: post.id,
            p_share_type: "link",
            p_shared_to: "copy_or_native_share",
          },
        );

        if (error) {
          throw error;
        }

        await refreshCounts();
      }
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to share this post.",
      );
    } finally {
      setShareLoading(false);
    }
  }

  function openPost() {
    router.push(postUrl);
  }

  function openComments() {
    router.push(`${postUrl}#comments`);
  }

  const publishedDate = formatDate(
    post.published_at || post.created_at,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1879FD]">
                <PinIcon />
                Pinned
              </span>
            )}

            {post.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                <StarIcon />
                Featured
              </span>
            )}

            {post.post_type && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                {post.post_type}
              </span>
            )}
          </div>

          {publishedDate && (
            <time
              dateTime={post.published_at || post.created_at}
              className="shrink-0 text-xs text-slate-400"
            >
              {publishedDate}
            </time>
          )}
        </div>

        <button
          type="button"
          onClick={openPost}
          className="mt-4 block w-full text-left"
          aria-label={
            post.title
              ? `Open post: ${post.title}`
              : "Open business post"
          }
        >
          {post.title && (
            <h3 className="text-xl font-bold leading-tight text-[#020D3A] transition hover:text-[#1879FD]">
              {post.title}
            </h3>
          )}

          {post.short_description && (
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              {post.short_description}
            </p>
          )}

          {post.description && (
            <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-7 text-slate-500">
              {post.description}
            </p>
          )}

          <span className="mt-4 inline-flex text-sm font-semibold text-[#1879FD]">
            View full post
            <span className="ml-1" aria-hidden="true">
              →
            </span>
          </span>
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              liked
                ? "bg-red-50 text-red-600"
                : "text-slate-600 hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-label={liked ? "Unlike post" : "Like post"}
          >
            <HeartIcon filled={liked} />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={openComments}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            aria-label="View comments"
          >
            <CommentIcon />
            <span>{post.comment_count ?? 0}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={shareLoading}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Share post"
          >
            <ShareIcon />
            <span>{shareCount}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saveLoading}
            className={`ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              saved
                ? "bg-blue-50 text-[#1879FD]"
                : "text-slate-600 hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-label={saved ? "Unsave post" : "Save post"}
          >
            <BookmarkIcon filled={saved} />
            <span>{saveCount}</span>
          </button>
        </div>

        {message && (
          <p
            className="mt-3 text-xs font-medium text-slate-500"
            role="status"
          >
            {message}
          </p>
        )}
      </div>
    </article>
  );
}