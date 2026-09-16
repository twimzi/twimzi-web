import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminPost = {
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
  is_featured: boolean;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminPosts({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const {
    data: postsData,
    error,
  } = await supabase.rpc("admin_get_posts", {
    p_search: search || null,
    p_business_id: null,
    p_limit: 100,
    p_offset: 0,
  });

  const posts = (postsData ?? []) as AdminPost[];

  const activeCount = posts.filter((post) => post.is_active).length;
  const featuredCount = posts.filter((post) => post.is_featured).length;
  const pinnedCount = posts.filter((post) => post.is_pinned).length;
  const publishedCount = posts.filter(
    (post) => post.published_at !== null,
  ).length;

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        Content Management
      </p>

      <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Posts</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage business posts and published content.
          </p>
        </div>

        <form className="flex w-full max-w-md gap-2" method="get">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search posts or businesses..."
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-primary)]"
          />

          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Posts Loaded" value={posts.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Featured" value={featuredCount} />
        <StatCard label="Pinned" value={pinnedCount} />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load posts. Verify that the secure admin posts RPC
          migration has been installed and that the current account is a
          SUPER_ADMIN.
          <div className="mt-2 text-xs opacity-80">{error.message}</div>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  <th className="px-5 py-4 font-bold">Post</th>
                  <th className="px-5 py-4 font-bold">Business</th>
                  <th className="px-5 py-4 font-bold">Type</th>
                  <th className="px-5 py-4 font-bold">Published</th>
                  <th className="px-5 py-4 font-bold">Featured</th>
                  <th className="px-5 py-4 font-bold">Pinned</th>
                  <th className="px-5 py-4 font-bold">Engagement</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                </tr>
              </thead>

              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      {search
                        ? "No posts matched your search."
                        : "No posts found."}
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-xs">
                          <p className="font-bold text-slate-900">
                            {post.title || "Untitled Post"}
                          </p>

                          {post.short_description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                              {post.short_description}
                            </p>
                          ) : null}

                          {post.slug ? (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              /{post.slug}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/businesses/${post.business_id}`}
                          className="font-semibold text-[var(--color-primary)] hover:underline"
                        >
                          {post.business_name || "Unknown Business"}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <Badge text={post.post_type || "â€”"} />
                      </td>

                      <td className="px-5 py-4">
                        {post.published_at ? (
                          <div>
                            <span className="font-medium">Yes</span>
                            <div className="text-xs text-[var(--color-text-muted)]">
                              {formatDate(post.published_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <BooleanBadge value={post.is_featured} />
                      </td>

                      <td className="px-5 py-4">
                        <BooleanBadge value={post.is_pinned} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
                          <span>â™¥ {post.like_count ?? 0}</span>
                          <span>â— {post.comment_count ?? 0}</span>
                          <span>â†— {post.share_count ?? 0}</span>
                          <span>â–¢ {post.save_count ?? 0}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <BooleanStatus value={post.is_active} />
                      </td>

                      <td className="px-5 py-4 text-xs text-[var(--color-text-muted)]">
                        {formatDate(post.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {posts.length > 0 ? (
            <div className="border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              Showing up to 100 posts
              {publishedCount > 0
                ? ` â€¢ ${publishedCount} published`
                : ""}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {text}
    </span>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function BooleanStatus({ value }: { value: boolean }) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
      }
    >
      {value ? "Active" : "Inactive"}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
