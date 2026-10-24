import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || data !== true) redirect("/");
  return supabase;
}

async function updateBlogPost(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const image = String(formData.get("featured_image_url") ?? "").trim();
  const metaTitle = String(formData.get("meta_title") ?? "").trim();
  const metaDescription = String(formData.get("meta_description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  if (!id || title.length < 5 || title.length > 180 || !slug || excerpt.length < 20 || excerpt.length > 500 || content.length < 50) throw new Error("Please complete all required fields with valid lengths.");
  if (image && !/^https:\/\//i.test(image)) throw new Error("Featured image URL must start with https://.");
  if (status !== "draft" && status !== "published") throw new Error("Invalid publication status.");
  const supabase = await requireSuperAdmin();
  const { error } = await supabase.from("blog_posts").update({
    title, slug, excerpt, content,
    featured_image_url: image || null,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) throw new Error(error.code === "23505" ? "That slug is already used by another article." : error.message);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=1");
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await requireSuperAdmin();
  const { data: post, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Could not load this article. Confirm the blog migration has been applied.</div>;
  }
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <Link href="/admin/blog" className="text-sm font-bold text-[var(--color-primary)] hover:underline">← Back to Blog Manager</Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Content & SEO</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Edit blog post</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Changes are saved directly to the blog database.</p>
      </div>
      <form action={updateBlogPost} className="mt-8 space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-8">
        <input type="hidden" name="id" value={post.id} />
        <div><label htmlFor="title" className="text-sm font-bold">Title *</label><input id="title" name="title" required minLength={5} maxLength={180} defaultValue={post.title} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div>
        <div><label htmlFor="slug" className="text-sm font-bold">Slug *</label><input id="slug" name="slug" required defaultValue={post.slug} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div>
        <div><label htmlFor="excerpt" className="text-sm font-bold">Summary *</label><textarea id="excerpt" name="excerpt" required minLength={20} maxLength={500} rows={3} defaultValue={post.excerpt} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div>
        <div><label htmlFor="content" className="text-sm font-bold">Article content *</label><textarea id="content" name="content" required minLength={50} rows={16} defaultValue={post.content} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6" /><p className="mt-1 text-xs text-[var(--color-text-muted)]">Separate paragraphs with blank lines. Use ## and ### for headings. HTML is not rendered.</p></div>
        <div><label htmlFor="featured_image_url" className="text-sm font-bold">Featured image URL</label><input id="featured_image_url" name="featured_image_url" type="url" defaultValue={post.featured_image_url ?? ""} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="meta_title" className="text-sm font-bold">SEO title</label><input id="meta_title" name="meta_title" maxLength={180} defaultValue={post.meta_title ?? ""} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div><div><label htmlFor="meta_description" className="text-sm font-bold">SEO description</label><textarea id="meta_description" name="meta_description" maxLength={320} rows={3} defaultValue={post.meta_description ?? ""} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" /></div></div>
        <div><label htmlFor="status" className="text-sm font-bold">Status</label><select id="status" name="status" defaultValue={post.status} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <div className="flex flex-wrap gap-3"><button type="submit" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">Save changes</button><Link href="/admin/blog" className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-bold">Cancel</Link></div>
      </form>
    </div>
  );
}
