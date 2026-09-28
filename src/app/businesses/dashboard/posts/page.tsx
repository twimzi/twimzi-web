"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  FileText,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  business_name: string;
};

type Post = {
  id: string;
  business_id: string;
  category_id: string | null;
  author_profile_id: string | null;
  post_type: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
};

type PostForm = {
  post_type: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  start_date: string;
  end_date: string;
  is_featured: boolean;
  is_pinned: boolean;
  is_active: boolean;
};

const emptyForm: PostForm = {
  post_type: "update",
  title: "",
  slug: "",
  short_description: "",
  description: "",
  start_date: "",
  end_date: "",
  is_featured: false,
  is_pinned: false,
  is_active: true,
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoOrNull(value: string) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function BusinessPostsDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseBrowserClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error("Please sign in to manage your posts.");
        }

        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id, business_name")
          .eq("owner_profile_id", user.id)
          .eq("is_active", true)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();

        if (businessError) {
          throw businessError;
        }

        if (!businessData) {
          throw new Error(
            "No active business profile was found for your account.",
          );
        }

        const { data: postData, error: postsError } = await supabase
          .from("posts")
          .select(
            "id, business_id, category_id, author_profile_id, post_type, title, slug, short_description, description, start_date, end_date, is_featured, is_pinned, is_active, published_at, created_at, updated_at, deleted_at, like_count, comment_count, share_count, save_count",
          )
          .eq("business_id", businessData.id)
          .is("deleted_at", null)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (postsError) {
          throw postsError;
        }

        if (cancelled) {
          return;
        }

        setBusiness(businessData);
        setPosts(postData ?? []);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your posts.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadPosts(businessId: string) {
    const supabase = createSupabaseBrowserClient();

    const { data, error: postsError } = await supabase
      .from("posts")
      .select(
        "id, business_id, category_id, author_profile_id, post_type, title, slug, short_description, description, start_date, end_date, is_featured, is_pinned, is_active, published_at, created_at, updated_at, deleted_at, like_count, comment_count, share_count, save_count",
      )
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (postsError) {
      throw postsError;
    }

    setPosts(data ?? []);
  }

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) =>
      [
        post.title,
        post.post_type,
        post.slug,
        post.short_description,
        post.description,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [posts, search]);

  function openCreateModal() {
    setEditingPost(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEditModal(post: Post) {
    setEditingPost(post);

    setForm({
      post_type: post.post_type ?? "update",
      title: post.title ?? "",
      slug: post.slug ?? "",
      short_description: post.short_description ?? "",
      description: post.description ?? "",
      start_date: formatDateTimeLocal(post.start_date),
      end_date: formatDateTimeLocal(post.end_date),
      is_featured: post.is_featured,
      is_pinned: post.is_pinned,
      is_active: post.is_active,
    });

    setError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingPost(null);
    setForm(emptyForm);
  }

  function updateForm<K extends keyof PostForm>(
    field: K,
    value: PostForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      setError("Business profile not found.");
      return;
    }

    if (!form.title.trim()) {
      setError("Post title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Post description is required.");
      return;
    }

    if (form.start_date && !toIsoOrNull(form.start_date)) {
      setError("Please enter a valid start date.");
      return;
    }

    if (form.end_date && !toIsoOrNull(form.end_date)) {
      setError("Please enter a valid end date.");
      return;
    }

    const startDate = toIsoOrNull(form.start_date);
    const endDate = toIsoOrNull(form.end_date);

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before the start date.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const payload = {
        business_id: business.id,
        author_profile_id: user.id,
        post_type: form.post_type.trim() || "update",
        title: form.title.trim(),
        slug: form.slug.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim(),
        start_date: startDate,
        end_date: endDate,
        is_featured: form.is_featured,
        is_pinned: form.is_pinned,
        is_active: form.is_active,
        updated_by: user.id,
      };

      if (editingPost) {
        const { error: updateError } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", editingPost.id)
          .eq("business_id", business.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Post updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("posts")
          .insert({
            ...payload,
            created_by: user.id,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Post created successfully.");
      }

      await loadPosts(business.id);

      setModalOpen(false);
      setEditingPost(null);
      setForm(emptyForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the post.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post: Post) {
    if (!business || deletingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${post.title}"? This post will be removed from your active posts.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { error: deleteError } = await supabase
        .from("posts")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_by: user.id,
        })
        .eq("id", post.id)
        .eq("business_id", business.id);

      if (deleteError) {
        throw deleteError;
      }

      await loadPosts(business.id);
      setSuccess("Post deleted successfully.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the post.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="h-24 rounded-2xl bg-white shadow-sm" />
            <div className="h-96 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Business profile required
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error ??
              "Create or activate your business profile before managing posts."}
          </p>

          <Link
            href="/add-business"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Business
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/businesses/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Posts
                </h1>

                <p className="text-sm text-slate-600">
                  Manage community posts for {business.business_name}.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </div>

        {(error || success) && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="alert"
          >
            {error ? (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{error ?? success}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Posts</p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {posts.length}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        </section>

        {filteredPosts.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {search ? "No posts found" : "No posts yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {search
                ? "Try a different post title, type, slug, or description."
                : "Create your first post to start engaging with your local community."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </button>
            )}
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Post
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Published
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Engagement
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {post.is_pinned && (
                              <Pin className="h-4 w-4 shrink-0 text-teal-600" />
                            )}

                            <p className="truncate font-semibold text-slate-900">
                              {post.title}
                            </p>
                          </div>

                          {post.short_description && (
                            <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {post.short_description}
                            </p>
                          )}

                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {post.is_featured && (
                              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                          {post.post_type || "update"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDate(post.published_at ?? post.created_at)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>{post.like_count ?? 0} likes</p>
                          <p>{post.comment_count ?? 0} comments</p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            post.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {post.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(post)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Edit ${post.title}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(post)}
                            disabled={deletingId === post.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${post.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filteredPosts.map((post) => (
                <article key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <Pin className="h-4 w-4 shrink-0 text-teal-600" />
                        )}

                        <h2 className="truncate font-semibold text-slate-900">
                          {post.title}
                        </h2>
                      </div>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {post.post_type || "update"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        post.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {post.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {post.short_description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {post.short_description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Published</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {formatDate(post.published_at ?? post.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Likes</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {post.like_count ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(post)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(post)}
                      disabled={deletingId === post.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-modal-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="post-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingPost ? "Edit Post" : "Create Post"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingPost
                    ? "Update your community post."
                    : "Share an update with your local community."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto px-5 py-5 sm:px-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="post_type"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Post Type
                  </label>

                  <select
                    id="post_type"
                    value={form.post_type}
                    onChange={(event) =>
                      updateForm("post_type", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="update">Update</option>
                    <option value="announcement">Announcement</option>
                    <option value="event">Event</option>
                    <option value="news">News</option>
                    <option value="promotion">Promotion</option>
                    <option value="article">Article</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Slug
                  </label>

                  <input
                    id="slug"
                    value={form.slug}
                    onChange={(event) =>
                      updateForm("slug", event.target.value)
                    }
                    placeholder="my-post-slug"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="title"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Title *
                  </label>

                  <input
                    id="title"
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder="Enter post title"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="short_description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Short Description
                  </label>

                  <input
                    id="short_description"
                    value={form.short_description}
                    onChange={(event) =>
                      updateForm("short_description", event.target.value)
                    }
                    placeholder="Short summary of your post"
                    maxLength={500}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Description *
                  </label>

                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Write your post..."
                    rows={7}
                    required
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="start_date"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Start Date
                  </label>

                  <input
                    id="start_date"
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(event) =>
                      updateForm("start_date", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end_date"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    End Date
                  </label>

                  <input
                    id="end_date"
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(event) =>
                      updateForm("end_date", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Active Post
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Keep this post active and available to customers.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) =>
                      updateForm("is_featured", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Featured Post
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Mark this post as featured for future discovery
                      placements.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={(event) =>
                      updateForm("is_pinned", event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Pin Post
                    </span>

                    <span className="mt-0.5 block text-xs text-slate-500">
                      Keep this post prioritized in supported business post
                      views.
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingPost ? "Update Post" : "Create Post"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}