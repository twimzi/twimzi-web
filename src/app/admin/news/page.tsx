import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const categories = ["Trade & Exports", "Manufacturing", "Markets & Policy"] as const;
type NewsCategory = typeof categories[number];
type NewsItem = { id:string; title:string; slug:string; category:NewsCategory; summary:string; source_name:string; status:"draft"|"published"|"scheduled"; published_at:string|null; updated_at:string };

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error || data !== true) redirect("/");
  return { supabase, user };
}
function parseJsonArray(value:FormDataEntryValue|null, field:string) { const raw=String(value??"").trim(); if(!raw)return []; try { const parsed=JSON.parse(raw); if(!Array.isArray(parsed))throw new Error(); return parsed; } catch { throw new Error(`${field} must be valid JSON array data.`); } }
function makeSlug(value:string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);
}
async function createNews(formData:FormData) {
  "use server";
  const title=String(formData.get("title")??"").trim();
  const slug=makeSlug(String(formData.get("slug")??"").trim()||title);
  const category=String(formData.get("category")??"");
  const summary=String(formData.get("summary")??"").trim();
  const content=String(formData.get("content")??"").trim();
  const sourceName=String(formData.get("source_name")??"").trim();
  const sourceUrl=String(formData.get("source_url")??"").trim();
  const image=String(formData.get("featured_image_url")??"").trim();
  const metaTitle=String(formData.get("meta_title")??"").trim();
  const metaDescription=String(formData.get("meta_description")??"").trim();
  const primaryKeyword=String(formData.get("primary_keyword")??"").trim();
  const secondaryKeywords=String(formData.get("secondary_keywords")??"").split(",").map(x=>x.trim()).filter(Boolean);
  const keyTakeaways=parseJsonArray(formData.get("key_takeaways"),"Key takeaways");
  const businessImpact=String(formData.get("business_impact")??"").trim();
  const actionPoints=parseJsonArray(formData.get("action_points"),"Action points");
  const keyFigures=parseJsonArray(formData.get("key_figures"),"Key figures");
  const faq=parseJsonArray(formData.get("faq"),"FAQs");
  const relatedLinks=parseJsonArray(formData.get("related_links"),"Related links");
  const status=String(formData.get("status")??"draft");
  const publishAt=String(formData.get("published_at")??"").trim();
  if(title.length<10||title.length>220) throw new Error("Title must be between 10 and 220 characters.");
  if(!slug) throw new Error("Enter a valid title or slug.");
  if(!categories.includes(category as NewsCategory)) throw new Error("Choose a valid category.");
  if(summary.length<30||summary.length>700||content.length<80) throw new Error("Summary must be 30–700 characters and article content at least 80 characters.");
  if(!sourceName||!/^https:\/\//i.test(sourceUrl)) throw new Error("A source name and secure HTTPS source URL are required.");
  if(image&&!(/^https:\/\//i.test(image)||(/^\/(?!\/)/.test(image)))) throw new Error("Image must be an HTTPS URL or local site path.");
  if(!["draft","published","scheduled"].includes(status)) throw new Error("Invalid publication status.");
  if(status!=="draft"&&(content.split(/\s+/).length<300||!primaryKeyword||keyTakeaways.length<3||businessImpact.length<100||actionPoints.length<2||faq.length<3)) throw new Error("Before publishing: write at least 300 useful words, add a primary search phrase, 3 source-supported takeaways, a meaningful business impact analysis, 2 practical actions and 3 specific FAQs.");
  const {supabase,user}=await requireSuperAdmin();
  const publishedAt=status==="draft"?null:publishAt?new Date(publishAt + "+05:30").toISOString():status==="published"?new Date().toISOString():null;
  if(status!=="draft"&&!publishedAt) throw new Error("Choose a publication date and time.");
  const {error}=await supabase.from("business_news").insert({title,slug,category,summary,content,source_name:sourceName,source_url:sourceUrl,featured_image_url:image||null,meta_title:metaTitle||null,meta_description:metaDescription||null,primary_keyword:primaryKeyword||null,secondary_keywords:secondaryKeywords,key_takeaways:keyTakeaways,business_impact:businessImpact||null,action_points:actionPoints,key_figures:keyFigures,faq,related_links:relatedLinks,editorial_updated_at:new Date().toISOString(),status,published_at:publishedAt,created_by:user.id});
  if(error) throw new Error(error.code==="23505"?"This news URL slug already exists.":error.message);
  for(const path of ["/news","/sitemap.xml","/admin/news"]) revalidatePath(path);
  redirect("/admin/news?created=1");
}
async function deleteNews(formData:FormData) {
  "use server";
  const id=String(formData.get("id")??"").trim();
  if(!id) throw new Error("Missing news item.");
  const {supabase}=await requireSuperAdmin();
  const {error}=await supabase.from("business_news").delete().eq("id",id);
  if(error) throw new Error(error.message);
  for(const path of ["/news","/sitemap.xml","/admin/news"]) revalidatePath(path);
  redirect("/admin/news?deleted=1");
}
function dateLabel(value:string|null) { return value?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value)):"Not scheduled"; }

export default async function AdminNewsPage({searchParams}:{searchParams:Promise<{created?:string;deleted?:string;saved?:string}>}) {
  const params=await searchParams;
  const {supabase}=await requireSuperAdmin();
  const {data,error}=await supabase.from("business_news").select("id,title,slug,category,summary,source_name,status,published_at,updated_at").order("updated_at",{ascending:false}).limit(200);
  const items=(data??[]) as NewsItem[];
  const counts={total:items.length,published:items.filter(x=>x.status==="published"&&x.published_at&&new Date(x.published_at)<=new Date()).length,drafts:items.filter(x=>x.status==="draft").length,scheduled:items.filter(x=>x.status==="scheduled"||(x.status==="published"&&x.published_at&&new Date(x.published_at)>new Date())).length};
  return <div className="pb-12">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-[var(--color-primary)]">Content & Growth</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Business News Manager</h1><p className="mt-2 text-sm text-[var(--color-text-muted)]">Create, edit, schedule and publish source-linked business news updates.</p></div><Link href="/news" target="_blank" className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold">View public news ↗</Link></div>
    {(params.created==="1"||params.saved==="1")&&<p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{params.saved==="1"?"News article updated successfully.":"News article created successfully."}</p>}
    {params.deleted==="1"&&<p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">News article deleted.</p>}
    {error&&<p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load news: {error.message}</p>}
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total articles",counts.total],["Published",counts.published],["Drafts",counts.drafts],["Scheduled",counts.scheduled]].map(([label,value])=><div key={label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><p className="text-sm text-[var(--color-text-muted)]">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div>)}</div>
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)]">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <h2 className="text-xl font-extrabold">Create news article</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">All published stories require an original source link.</p>
        <form action={createNews} className="mt-6 space-y-4">
          <div><label htmlFor="news-title" className="text-sm font-bold">Headline *</label><input id="news-title" name="title" required minLength={10} maxLength={220} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" placeholder="Write a clear, factual headline"/></div>
          <div><label htmlFor="news-slug" className="text-sm font-bold">URL slug (optional)</label><input id="news-slug" name="slug" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" placeholder="Generated from headline if blank"/></div>
          <div><label htmlFor="news-category" className="text-sm font-bold">Category *</label><select id="news-category" name="category" required className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="news-summary" className="text-sm font-bold">Summary *</label><textarea id="news-summary" name="summary" required minLength={30} maxLength={700} rows={4} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6" placeholder="A concise factual summary."/></div>
          <div><label htmlFor="news-content" className="text-sm font-bold">Full article *</label><textarea id="news-content" name="content" required minLength={80} rows={12} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6" placeholder={"Use Markdown.\n\n## What happened\n\nExplain the announcement in your own words.\n\n## Why it matters\n\nAdd practical context and limitations."}/><p className="mt-1 text-xs text-[var(--color-text-muted)]">Markdown headings use ## and ###. Do not copy full source articles.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="source-name" className="text-sm font-bold">Source / publisher *</label><input id="source-name" name="source_name" required className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" placeholder="e.g. Press Information Bureau"/></div><div><label htmlFor="source-url" className="text-sm font-bold">Original source URL *</label><input id="source-url" name="source_url" type="url" required pattern="https://.*" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" placeholder="https://..."/></div></div>
          <div><label htmlFor="news-image" className="text-sm font-bold">Featured image URL (optional)</label><input id="news-image" name="featured_image_url" type="url" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm" placeholder="HTTPS image URL"/></div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4"><h3 className="font-extrabold text-violet-900">Search intent & answer-engine structure</h3><p className="mt-1 text-xs leading-5 text-violet-800">Write for the reader’s actual question. Use specific terms naturally; never repeat keywords just to manipulate rankings.</p>
          <div className="mt-4"><label htmlFor="primary_keyword" className="text-sm font-bold">Primary search phrase</label><input id="primary_keyword" name="primary_keyword" maxLength={120} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm" placeholder="e.g. Export Promotion Mission revised guidelines"/></div>
          <div className="mt-3"><label htmlFor="secondary_keywords" className="text-sm font-bold">Related search phrases (comma separated)</label><input id="secondary_keywords" name="secondary_keywords" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm" placeholder="export incentives, market access support, exporter eligibility"/></div>
          <div className="mt-3"><label htmlFor="key_takeaways" className="text-sm font-bold">Key takeaways (JSON array of strings)</label><textarea id="key_takeaways" name="key_takeaways" rows={3} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-xs" placeholder={'["What changed, with exact date and source","Who is affected","What is not confirmed"]'}/></div>
          <div className="mt-3"><label htmlFor="business_impact" className="text-sm font-bold">Business impact analysis</label><textarea id="business_impact" name="business_impact" rows={4} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-6" placeholder="Explain which businesses may be affected, how, what is known and what remains uncertain."/></div>
          <div className="mt-3"><label htmlFor="action_points" className="text-sm font-bold">Practical action points (JSON array)</label><textarea id="action_points" name="action_points" rows={4} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-xs" placeholder={'[{"title":"Check eligibility","detail":"Review the current official guideline before applying"}]'}/></div>
          <div className="mt-3"><label htmlFor="key_figures" className="text-sm font-bold">Key figures (JSON array)</label><textarea id="key_figures" name="key_figures" rows={3} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-xs" placeholder={'[{"label":"Export value","value":"USD 31.97 billion","context":"April–September FY 2026–27; official release"}]'}/></div>
          <div className="mt-3"><label htmlFor="faq" className="text-sm font-bold">Specific FAQs (JSON array)</label><textarea id="faq" name="faq" rows={4} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-xs" placeholder={'[{"question":"Who is eligible?","answer":"The source states... Check the full guideline for conditions."}]'}/></div>
          <div className="mt-3"><label htmlFor="related_links" className="text-sm font-bold">Related authoritative links (JSON array)</label><textarea id="related_links" name="related_links" rows={3} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 font-mono text-xs" placeholder={'[{"title":"Official guideline","url":"https://...","publisher":"Department of Commerce"}]'}/></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="news-meta-title" className="text-sm font-bold">SEO title</label><input id="news-meta-title" name="meta_title" maxLength={180} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"/></div><div><label htmlFor="news-meta-description" className="text-sm font-bold">SEO description</label><textarea id="news-meta-description" name="meta_description" maxLength={320} rows={2} className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"/></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="news-status" className="text-sm font-bold">Publication status</label><select id="news-status" name="status" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"><option value="draft">Save draft</option><option value="published">Publish now</option><option value="scheduled">Schedule</option></select></div><div><label htmlFor="news-published-at" className="text-sm font-bold">Publish date & time</label><input id="news-published-at" name="published_at" type="datetime-local" className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"/></div></div>
          <button type="submit" className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white hover:bg-[var(--color-primary-dark)]">Save news article</button>
        </form>
      </section>
      <section className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">All news <span className="text-sm text-[var(--color-text-muted)]">({items.length})</span></h2><span className="text-xs text-[var(--color-text-muted)]">Latest updated first</span></div>
        <div className="mt-5 space-y-3">{items.map(item=><article key={item.id} className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{item.category}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status==="published"?"bg-emerald-50 text-emerald-700":item.status==="scheduled"?"bg-indigo-50 text-indigo-700":"bg-amber-50 text-amber-700"}`}>{item.status}</span></div>
          <h3 className="mt-3 font-bold leading-5">{item.title}</h3><p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.source_name} · {dateLabel(item.published_at)}</p><p className="mt-3 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">{item.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/news/${item.id}`} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">Edit</Link>{item.status==="published"&&item.published_at&&new Date(item.published_at)<=new Date()&&<Link href={`/news/${item.slug}`} target="_blank" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-bold">View ↗</Link>}<form action={deleteNews}><input type="hidden" name="id" value={item.id}/><button type="submit" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Delete</button></form></div>
        </article>)}{items.length===0&&!error&&<p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">No news items yet. Create your first article.</p>}</div>
      </section>
    </div>
  </div>;
}
