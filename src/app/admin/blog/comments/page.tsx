import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BlogComment = {
  id: string;
  post_id: string;
  display_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  blog_posts: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || data !== true) redirect("/");
  return supabase;
}

async function moderateComment(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!id || !["pending", "approved", "rejected"].includes(status)) throw new Error("Invalid moderation request.");
  const supabase = await requireSuperAdmin();
  const { error } = await supabase.from("blog_post_comments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog/comments");
  revalidatePath("/blog");
}

async function deleteComment(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing comment ID.");
  const supabase = await requireSuperAdmin();
  const { error } = await supabase.from("blog_post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog/comments");
}

export default async function BlogCommentModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const supabase = await requireSuperAdmin();
  const selectedStatus = ["pending", "approved", "rejected"].includes(params.status ?? "") ? params.status! : "pending";
  const { data, error } = await supabase.from("blog_post_comments")
    .select("id,post_id,display_name,body,status,created_at,blog_posts!inner(title,slug)")
    .eq("status", selectedStatus)
    .order("created_at", { ascending: false })
    .limit(100);
  const comments = (data ?? []) as unknown as BlogComment[];

  return (
    <div className="pb-12">
      <Link href="/admin/blog" className="text-sm font-bold text-[var(--color-primary)] hover:underline">← Back to Blog Manager</Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Community safety</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">Blog comment moderation</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Approve comments before they appear publicly, or reject and delete spam or abusive content.</p>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Comment status filters">
        {(["pending", "approved", "rejected"] as const).map((status) => (
          <Link key={status} href={`/admin/blog/comments?status=${status}`} className={`rounded-xl border px-4 py-2.5 text-sm font-bold capitalize ${selectedStatus === status ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-white"}`}>{status}</Link>
        ))}
      </nav>
      {error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load comments. Check the blog engagement migration.</p> : null}
      <div className="mt-6 space-y-4">
        {comments.map((item) => {
          const article = Array.isArray(item.blog_posts) ? item.blog_posts[0] : item.blog_posts;
          return (
            <article key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{item.display_name}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p>
                  {article ? <Link href={`/blog/${article.slug}`} target="_blank" className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline">{article.title} ↗</Link> : null}
                </div>
                <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-bold capitalize">{item.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-secondary)]">{item.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.status !== "approved" ? <form action={moderateComment}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button type="submit" className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white">Approve</button></form> : null}
                {item.status !== "rejected" ? <form action={moderateComment}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="rejected" /><button type="submit" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">Reject</button></form> : null}
                <form action={deleteComment}><input type="hidden" name="id" value={item.id} /><button type="submit" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Delete permanently</button></form>
              </div>
            </article>
          );
        })}
        {!comments.length && !error ? <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-muted)]">No {selectedStatus} comments.</div> : null}
      </div>
    </div>
  );
}
