"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BusinessPost = {
  id: string;
  business_id: string;
  post_type: string | null;
  title: string | null;
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

type Props = {
  post: BusinessPost;
};

export default function BusinessPostCard({ post }: Props) {
  const router = useRouter();

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saveCount, setSaveCount] = useState(post.save_count ?? 0);
  const [working, setWorking] = useState(false);

  async function requireUser() {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=/businesses/${post.business_id}`);
      return null;
    }

    return {
      supabase,
      user,
    };
  }

  async function toggleLike() {
    if (working) {
      return;
    }

    const result = await requireUser();

    if (!result) {
      return;
    }

    const { supabase, user } = result;

    setWorking(true);

    if (liked) {
      const { error } = await supabase.rpc("unlike_business_post", {
        p_post_id: post.id,
        p_profile_id: user.id,
      });

      if (!error) {
        setLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      }
    } else {
      const { data, error } = await supabase.rpc("like_business_post", {
        p_post_id: post.id,
        p_profile_id: user.id,
      });

      if (!error && data !== false) {
        setLiked(true);
        setLikeCount((count) => count + 1);
      }
    }

    setWorking(false);
  }

  async function toggleSave() {
    if (working) {
      return;
    }

    const result = await requireUser();

    if (!result) {
      return;
    }

    const { supabase } = result;

    setWorking(true);

    if (saved) {
      const { error } = await supabase.rpc("unsave_business_post", {
        p_post_id: post.id,
      });

      if (!error) {
        setSaved(false);
        setSaveCount((count) => Math.max(0, count - 1));
      }
    } else {
      const { data, error } = await supabase.rpc("save_business_post", {
        p_post_id: post.id,
      });

      if (!error && data !== false) {
        setSaved(true);
        setSaveCount((count) => count + 1);
      }
    }

    setWorking(false);
  }

  async function sharePost() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/businesses/${post.business_id}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: post.title || "Twimzi Business Post",
          text:
            post.short_description ||
            post.description ||
            "Check out this post on Twimzi.",
          url,
        });

        return;
      } catch {
        return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  const publishedDate = post.published_at
    ? new Date(post.published_at)
    : new Date(post.created_at);

  const formattedDate = Number.isNaN(publishedDate.getTime())
    ? ""
    : publishedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {post.is_pinned && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1879FD]">
                ðŸ“Œ Pinned
              </span>
            )}

            {post.is_featured && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                â­ Featured
              </span>
            )}

            {post.post_type && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                {post.post_type}
              </span>
            )}
          </div>

          {formattedDate && (
            <time
              dateTime={post.published_at || post.created_at}
              className="shrink-0 text-xs text-slate-400"
            >
              {formattedDate}
            </time>
          )}
        </div>

        {post.title && (
          <h3 className="mt-4 text-xl font-bold leading-tight text-[#020D3A]">
            {post.title}
          </h3>
        )}

        {(post.short_description || post.description) && (
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
            {post.short_description || post.description}
          </p>
        )}

        {(post.start_date || post.end_date) && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Event / Offer Period
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {post.start_date
                ? new Date(post.start_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "â€”"}

              {" â†’ "}

              {post.end_date
                ? new Date(post.end_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "â€”"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={toggleLike}
          disabled={working}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            liked
              ? "bg-blue-50 text-[#1879FD]"
              : "text-slate-500 hover:bg-slate-50 hover:text-[#1879FD]"
          } disabled:opacity-50`}
        >
          <span>{liked ? "â™¥" : "â™¡"}</span>
          <span>{likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            router.push(`/businesses/${post.business_id}#comments`);
          }}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#1879FD]"
        >
          <span>ðŸ’¬</span>
          <span>{post.comment_count ?? 0}</span>
        </button>

        <button
          type="button"
          onClick={sharePost}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#8E07FB]"
        >
          <span>â†—</span>
          <span>{post.share_count ?? 0}</span>
        </button>

        <button
          type="button"
          onClick={toggleSave}
          disabled={working}
          className={`ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            saved
              ? "bg-purple-50 text-purple-700"
              : "text-slate-500 hover:bg-slate-50 hover:text-purple-700"
          } disabled:opacity-50`}
        >
          <span>{saved ? "ðŸ”–" : "ðŸ”–"}</span>
          <span>{saveCount}</span>
        </button>
      </div>
    </article>
  );
}
