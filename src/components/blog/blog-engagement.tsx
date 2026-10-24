"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export default function BlogEngagement({ postId, postUrl, postTitle }: { postId: string; postUrl: string; postTitle: string }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [shareLabel, setShareLabel] = useState("Share article");

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const [{ count: likes }, { data: { user } }, { data: visibleComments }] = await Promise.all([
      supabase.from("blog_post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
      supabase.auth.getUser(),
      supabase.from("blog_post_comments").select("id,display_name,body,created_at").eq("post_id", postId).eq("status", "approved").order("created_at", { ascending: false }).limit(50),
    ]);
    setCount(likes ?? 0);
    setUserId(user?.id ?? null);
    if (user) {
      const { data: ownLike } = await supabase.from("blog_post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
      setLiked(Boolean(ownLike));
    } else setLiked(false);
    setComments((visibleComments ?? []) as Comment[]);
    setLoading(false);
  }, [postId]);

  useEffect(() => { void load(); }, [load]);

  async function toggleLike() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice("Please sign in to like this article.");
      router.push("/login");
      return;
    }
    setSaving(true);
    setNotice("");
    if (liked) {
      const { error } = await supabase.from("blog_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) setNotice("Could not remove your like. Please try again.");
      else { setLiked(false); setCount((value) => Math.max(0, value - 1)); }
    } else {
      const { error } = await supabase.from("blog_post_likes").insert({ post_id: postId, user_id: user.id });
      if (error && error.code !== "23505") setNotice("Could not save your like. Please try again.");
      else if (!error) { setLiked(true); setCount((value) => value + 1); }
    }
    setSaving(false);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = comment.trim();
    if (body.length < 2 || body.length > 2000) {
      setNotice("Comments must be between 2 and 2,000 characters.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice("Please sign in to comment.");
      router.push("/login");
      return;
    }
    const displayName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Reader").trim().slice(0, 80) || "Reader";
    setSaving(true);
    setNotice("");
    const { error } = await supabase.from("blog_post_comments").insert({ post_id: postId, user_id: user.id, display_name: displayName, body, status: "pending" });
    setSaving(false);
    if (error) setNotice("Your comment could not be submitted. Please try again.");
    else {
      setComment("");
      setNotice("Thanks! Your comment was submitted and will appear after moderation.");
    }
  }

  async function shareArticle() {
    const url = typeof window !== "undefined" ? window.location.href : postUrl;
    try {
      if (navigator.share) {
        await navigator.share({ title: postTitle, url });
        setShareLabel("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied");
      } catch {
        setNotice("Copy this article URL to share it: " + url);
      }
    }
    window.setTimeout(() => setShareLabel("Share article"), 2500);
  }

  return (
    <section className="mt-10 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-7" aria-label="Article engagement">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={toggleLike} disabled={saving || loading} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${liked ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-rose-300"}`}>
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {liked ? "Liked" : "Like"} · {count}
        </button>
        <button type="button" onClick={shareArticle} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)] hover:border-[var(--color-primary)]">
          <span aria-hidden="true">↗</span> {shareLabel}
        </button>
      </div>
      {notice ? <p role="status" className="mt-3 text-sm text-[var(--color-text-secondary)]">{notice}</p> : null}

      <div className="mt-8 border-t border-[var(--color-border)] pt-7">
        <h2 className="text-xl font-extrabold text-[var(--color-text)]">Comments ({comments.length})</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Comments are reviewed before appearing publicly.</p>
        <form onSubmit={submitComment} className="mt-4">
          <label htmlFor="blog-comment" className="text-sm font-bold text-[var(--color-text)]">Add your comment</label>
          <textarea id="blog-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} minLength={2} rows={4} placeholder={userId ? "Share a helpful thought..." : "Sign in to leave a comment"} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-text-muted)]">{comment.length}/2000 characters</span>
            <button type="submit" disabled={saving || comment.trim().length < 2} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit comment"}</button>
          </div>
        </form>
        <div className="mt-6 space-y-4">
          {comments.map((item) => (
            <article key={item.id} className="rounded-xl bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[var(--color-text)]">{item.display_name}</p>
                <time className="text-xs text-[var(--color-text-muted)] date">{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.created_at))}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-secondary)]">{item.body}</p>
            </article>
          ))}
          {!loading && comments.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">Be the first to join the discussion.</p> : null}
        </div>
      </div>
    </section>
  );
}
