import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
};

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || data !== true) redirect("/");
  return { supabase, user };
}

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}

async function createBlogPost(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const featuredImageUrl = String(formData.get("featured_image_url") ?? "").trim();
  const metaTitle = String(formData.get("meta_title") ?? "").trim();
  const metaDescription = String(formData.get("meta_description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  let slug = makeSlug(String(formData.get("slug") ?? "").trim() || title);

  if (title.length < 5 || title.length > 180) throw new Error("Title must be between 5 and 180 characters.");
  if (excerpt.length < 20 || excerpt.length > 500) throw new Error("Excerpt must be between 20 and 500 characters.");
  if (content.length < 50) throw new Error("Article content must contain at least 50 characters.");
  if (!slug) throw new Error("Please provide a valid title or slug.");
  if (featuredImageUrl && !/^https:\/\//i.test(featuredImageUrl)) throw new Error("Featured image URL must start with https://.");
  if (status !== "draft" && status !== "published") throw new Error("Invalid publication status.");

  const { supabase, user } = await requireSuperAdmin();
  const { error } = await supabase.from("blog_posts").insert({
    title, slug, excerpt, content,
    featured_image_url: featuredImageUrl || null,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    status,
    author_id: user.id,
    published_at: status === "published" ? new Date().toISOString() : null,
  });
  if (error) throw new Error(error.code === "23505" ? "That slug is already in use. Choose another." : error.message);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?created=1");
}

async function changePostStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "draft" && status !== "published")) throw new Error("Invalid blog status request.");
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("blog_posts").update({
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ created?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.from("blog_posts")
    .select("id,title,slug,excerpt,status,published_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  const posts = (data ?? []) as BlogPost[];

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">Content & SEO</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">Blog Manager</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Write articles, optimize search snippets and publish updates to the public blog.</p>
        </div>
        <Link href="/blog" target="_blank" className="w-fit rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold">View public blog ↗</Link>
      </div>

      {params.created === "1" || params.saved === "1" ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Blog post saved successfully.</div> : null}
      {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Posts could not be loaded. Confirm that the blog database migration has been applied.</div> : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <h2 className="text-xl font-extrabold">Write a blog post</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Use a helpful title, a concise summary and original, practical content.</p>
          <form action={createBlogPost} className="mt-6 space-y-5">
            <div>
              <label htmlFor="title" className="text-sm font-bold">Title *</label>
              <input id="title" name="title" required minLength={5} maxLength={180} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="How to Promote Your Small Business Online for Free" />
            </div>
            <div>
              <label htmlFor="slug" className="text-sm font-bold">URL slug (optional)</label>
              <input id="slug" name="slug" className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="how-to-promote-small-business-online" />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Leave blank to generate it from the title.</p>
            </div>
            <div>
              <label htmlFor="excerpt" className="text-sm font-bold">Short summary *</label>
              <textarea id="excerpt" name="excerpt" required minLength={20} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="Explain what readers will learn in this article." />
            </div>
            <div>
              <label htmlFor="content" className="text-sm font-bold">Article content *</label>
              <textarea id="content" name="content" required minLength={50} rows={12} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]" placeholder={"Write your article here. Separate paragraphs with a blank line.\n\nUse ## Heading or ### Subheading on its own line for sections."} />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Plain text with paragraph breaks; headings can start with ## or ###. HTML is not rendered.</p>
            </div>
            <div>
              <label htmlFor="featured_image_url" className="text-sm font-bold">Featured image URL (optional)</label>
              <input id="featured_image_url" name="featured_image_url" type="url" className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="https://..." />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="meta_title" className="text-sm font-bold">SEO title (optional)</label>
                <input id="meta_title" name="meta_title" maxLength={180} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="Search result title" />
              </div>
              <div>
                <label htmlFor="meta_description" className="text-sm font-bold">SEO description (optional)</label>
                <textarea id="meta_description" name="meta_description" maxLength={320} rows={3} className="mt-2 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" placeholder="A clear description for search results." />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="text-sm font-bold">Save as</label>
              <select id="status" name="status" defaultValue="draft" className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">
                <option value="draft">Draft (not public)</option>
                <option value="published">Publish now</option>
              </select>
            </div>
            <button type="submit" className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-dark)]">Save blog post</button>
          </form>
        </section>

        <section className="min-w-0">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <h2 className="text-xl font-extrabold">Your articles <span className="ml-2 text-sm font-semibold text-[var(--color-text-muted)]">({posts.length})</span></h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Published articles are visible to everyone. Drafts are admin-only.</p>
            <div className="mt-5 space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold leading-5">{post.title}</h3>
                      <p className="mt-1 break-all text-xs text-[var(--color-text-muted)]">/blog/{post.slug}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${post.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{post.status}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{post.excerpt}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/admin/blog/${post.id}`} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">Edit</Link>
                    {post.status === "published" ? <Link href={`/blog/${post.slug}`} target="_blank" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">View ↗</Link> : null}
                    <form action={changePostStatus}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="status" value={post.status === "published" ? "draft" : "published"} />
                      <button type="submit" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">{post.status === "published" ? "Unpublish" : "Publish"}</button>
                    </form>
                  </div>
                </article>
              ))}
              {!posts.length && !error ? <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">No articles yet. Write your first post using the form.</p> : null}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h3 className="font-extrabold">Suggested first articles</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--color-text-secondary)]">
              <li>How to Promote Your Small Business Online for Free in India</li>
              <li>How to List Your Business Online in India</li>
              <li>How to Find Manufacturers and Wholesalers in Ludhiana</li>
              <li>Digital Marketing Tips for Manufacturers and B2B Businesses</li>
              <li>How to Choose a Reliable Local Service Provider</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
