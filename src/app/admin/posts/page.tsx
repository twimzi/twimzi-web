"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  business_id: string;
  business_name: string | null;
  category_id: string | null;
  post_type: string | null;
  title: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean | null;
  is_pinned: boolean | null;
  is_active: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  save_count: number | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

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

function statusClasses(active: boolean | null) {
  return active
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-600";
}

export default function AdminPostsPage() {
  const supabase = createSupabaseBrowserClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { data: adminCheck, error: adminError } =
        await supabase.rpc("is_super_admin");

      if (adminError) throw adminError;

      if (!adminCheck) {
        setIsSuperAdmin(false);
        throw new Error(
          "You do not have permission to access this page.",
        );
      }

      setIsSuperAdmin(true);

      const { data, error: postsError } = await supabase.rpc(
        "admin_get_posts",
        {
          p_search: submittedSearch.trim() || null,
          p_business_id: null,
          p_limit: 100,
          p_offset: 0,
        },
      );

      if (postsError) throw postsError;

      setPosts((data ?? []) as Post[]);
    } catch (err) {
      setPosts([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load posts.",
      );
    } finally {
      setLoading(false);
    }
  }, [submittedSearch, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPosts]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search);
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
  }

  if (!isSuperAdmin && !loading && error.includes("permission")) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Posts
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const featuredCount = posts.filter(
    (post) => post.is_featured,
  ).length;

  const pinnedCount = posts.filter(
    (post) => post.is_pinned,
  ).length;

  const activeCount = posts.filter(
    (post) => post.is_active,
  ).length;

  const totalEngagement = posts.reduce(
    (total, post) =>
      total +
      (post.like_count ?? 0) +
      (post.comment_count ?? 0) +
      (post.share_count ?? 0) +
      (post.save_count ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Posts
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage business posts and community-facing content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Posts Loaded</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {posts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Featured / Pinned
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {featuredCount} / {pinnedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Engagement</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalEngagement}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 md:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="post-search" className="sr-only">
              Search posts
            </label>

            <input
              id="post-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, slug, description or business..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {submittedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && !error.includes("permission") && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadPosts()}
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
              Post Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing up to 100 posts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPosts()}
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
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
              P
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No posts found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {submittedSearch
                ? "No posts match your search criteria."
                : "There are currently no posts available to display."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Post</th>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Engagement</th>
                    <th className="px-5 py-3">Published</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {post.title || "Untitled post"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {post.slug || post.id}
                          </p>

                          {post.short_description && (
                            <p className="mt-1 max-w-sm truncate text-xs text-slate-400">
                              {post.short_description}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {post.is_featured && (
                              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                Featured
                              </span>
                            )}

                            {post.is_pinned && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                Pinned
                              </span>
                            )}

                            {post.post_type && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                {post.post_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/businesses/${post.business_id}`}
                          className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          {post.business_name ||
                            "Unknown business"}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                            post.is_active,
                          )}`}
                        >
                          {post.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Likes: {post.like_count ?? 0}
                          </span>

                          <span>
                            Comments: {post.comment_count ?? 0}
                          </span>

                          <span>
                            Shares: {post.share_count ?? 0}
                          </span>

                          <span>
                            Saves: {post.save_count ?? 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDateTime(post.published_at)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(post.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {posts.map((post) => (
                <div key={post.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {post.title || "Untitled post"}
                      </p>

                      <Link
                        href={`/admin/businesses/${post.business_id}`}
                        className="mt-1 block truncate text-sm text-slate-500 hover:text-slate-900 hover:underline"
                      >
                        {post.business_name ||
                          "Unknown business"}
                      </Link>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        post.is_active,
                      )}`}
                    >
                      {post.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  {post.short_description && (
                    <p className="mt-3 text-sm text-slate-500">
                      {post.short_description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.is_featured && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                        Featured
                      </span>
                    )}

                    {post.is_pinned && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Pinned
                      </span>
                    )}

                    {post.post_type && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {post.post_type}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Likes
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {post.like_count ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Comments
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {post.comment_count ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Shares
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {post.share_count ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Saves
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {post.save_count ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    <p>
                      Published:{" "}
                      {formatDateTime(post.published_at)}
                    </p>

                    <p className="mt-1">
                      Created: {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}