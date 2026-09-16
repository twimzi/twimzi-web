import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminCommunityPost = {
  id: string;
  business_id: string;
  business_name: string | null;
  post_type: string | null;
  title: string | null;
  short_description: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  has_poll: boolean;
  poll_question: string | null;
  poll_expires_at: string | null;
  poll_total_votes: number;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminCommunity({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_get_community", {
    p_search: search || null,
    p_limit: 100,
    p_offset: 0,
  });

  const posts = (data ?? []) as AdminCommunityPost[];

  const activeCount = posts.filter((post) => post.is_active).length;
  const featuredCount = posts.filter((post) => post.is_featured).length;
  const pinnedCount = posts.filter((post) => post.is_pinned).length;
  const pollCount = posts.filter((post) => post.has_poll).length;

  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-primary)]">
        Community
      </p>

      <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Community</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Manage community posts, engagement and polls.
          </p>
        </div>

        <form
          method="get"
          className="flex w-full max-w-md gap-2"
        >
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
        <StatCard label="Polls" value={pollCount} />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-bold">
            Unable to load Community content.
          </p>

          <p className="mt-1">
            Verify the admin Community RPC migration and SUPER_ADMIN access.
          </p>

          <p className="mt-2 text-xs opacity-80">
            {error.message}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full text-left text-sm">
              <thead className="border-b bg-[var(--color-surface)]">
                <tr>
                  <th className="px-5 py-4 font-bold">Post</th>
                  <th className="px-5 py-4 font-bold">Business</th>
                  <th className="px-5 py-4 font-bold">Type</th>
                  <th className="px-5 py-4 font-bold">Poll</th>
                  <th className="px-5 py-4 font-bold">Engagement</th>
                  <th className="px-5 py-4 font-bold">Featured</th>
                  <th className="px-5 py-4 font-bold">Pinned</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Published</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                </tr>
              </thead>

              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]"
                    >
                      {search
                        ? "No Community posts matched your search."
                        : "No Community posts found."}
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-sm">
                          <p className="font-bold text-slate-900">
                            {post.title || "Untitled Post"}
                          </p>

                          {post.short_description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                              {post.short_description}
                            </p>
                          ) : null}

                          <p className="mt-1 text-[10px] text-slate-400">
                            {post.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {post.business_name || "Unknown Business"}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {post.business_id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <TypeBadge type={post.post_type} />
                      </td>

                      <td className="px-5 py-4">
                        {post.has_poll ? (
                          <div className="max-w-xs">
                            <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                              Poll
                            </span>

                            {post.poll_question ? (
                              <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                                {post.poll_question}
                              </p>
                            ) : null}

                            <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                              {post.poll_total_votes ?? 0} votes
                            </p>

                            {post.poll_expires_at ? (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Ends {formatDate(post.poll_expires_at)}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No poll
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                          <span>â™¥ {post.like_count ?? 0}</span>
                          <span>â— {post.comment_count ?? 0}</span>
                          <span>â†— {post.share_count ?? 0}</span>
                          <span>â–¢ {post.save_count ?? 0}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <BooleanBadge value={post.is_featured} />
                      </td>

                      <td className="px-5 py-4">
                        <BooleanBadge value={post.is_pinned} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge value={post.is_active} />
                      </td>

                      <td className="px-5 py-4">
                        {post.published_at ? (
                          <div>
                            <span className="font-semibold text-emerald-700">
                              Published
                            </span>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {formatDate(post.published_at)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Not published
                          </span>
                        )}
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
            <div className="flex flex-wrap gap-4 border-t bg-[var(--color-surface)] px-5 py-4 text-xs text-[var(--color-text-muted)]">
              <span>Showing up to 100 posts</span>
              <span>â€¢</span>
              <span>{activeCount} active</span>
              <span>â€¢</span>
              <span>{featuredCount} featured</span>
              <span>â€¢</span>
              <span>{pinnedCount} pinned</span>
              <span>â€¢</span>
              <span>{pollCount} polls</span>
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

      <p className="mt-2 text-3xl font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: string | null;
}) {
  const value = type || "post";

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
      {value.replaceAll("_", " ")}
    </span>
  );
}

function BooleanBadge({
  value,
}: {
  value: boolean;
}) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function StatusBadge({
  value,
}: {
  value: boolean;
}) {
  return (
    <span
      className={
        value
          ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          : "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "â€”";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
