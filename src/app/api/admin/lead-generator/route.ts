import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  const { data: allowed, error } = await supabase.rpc("is_super_admin");
  if (error || allowed !== true) return { response: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { supabase, user };
}

const text = (value: unknown, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";
const list = (value: unknown, max = 80) => Array.isArray(value) ? value.map(v => text(v, 100)).filter(Boolean).slice(0, max) : [];
const allowedFeedFields = new Set(["business_name","category","business_email","business_phone","website","address","city","district","state","professional_contact_name","professional_designation","professional_work_email"]);

function safeHttpsUrl(value: unknown) {
  const raw = text(value, 1000);
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid source URL."); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") throw new Error("Sources must use HTTPS on the standard port and cannot contain embedded credentials.");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) throw new Error("Private, local or IP-literal URLs are not permitted.");
  return url.toString();
}

function validateFeedConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Enter a valid JSON feed mapping.");
  const config = value as Record<string, unknown>;
  const itemsPath = text(config.items_path, 200);
  if (!itemsPath || itemsPath.split(".").length > 6 || !config.fields || typeof config.fields !== "object" || Array.isArray(config.fields)) throw new Error("Mapping must contain items_path and fields.");
  const fields = config.fields as Record<string, unknown>;
  const safeFields: Record<string,string> = {};
  for (const [field,path] of Object.entries(fields)) {
    if (allowedFeedFields.has(field) && typeof path === "string" && path.trim() && path.split(".").length <= 6) safeFields[field] = path.trim();
  }
  if (!safeFields.business_name) throw new Error("Mapping must include business_name.");
  return { items_path: itemsPath, fields: safeFields };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") || 50)));
  const status = text(url.searchParams.get("status"), 20);
  const emailFilter = text(url.searchParams.get("email"), 20);
  const duplicatesOnly = url.searchParams.get("duplicates") === "true";
  const search = text(url.searchParams.get("q"), 100).replace(/[,%()]/g, " ").trim();
  const [sources, jobs, discoveryRuns] = await Promise.all([
    auth.supabase.from("lead_generator_sources").select("*").order("created_at", { ascending: false }).limit(250),
    auth.supabase.from("lead_generator_jobs").select("*").order("created_at", { ascending: false }).limit(100),
    auth.supabase.from("lead_generator_discovery_runs").select("id,provider,region_state,status,records_seen,records_inserted,records_duplicate,records_rejected,error_message,started_at,finished_at").order("started_at", { ascending: false }).limit(20),
  ]);
  if (sources.error || jobs.error) return NextResponse.json({ error: "Lead Generator schema is unavailable. Confirm the production migrations are applied and refresh." }, { status: 500 });
  let leadsQuery = auth.supabase.from("admin_contact_bank_review")
    .select("id,archived_at,full_name,company_name,email,phone,website,website_domain,city,district,state,business_category,source,source_url,review_status,verification_status,created_at,normalized_phone,duplicate_reasons,phone_match_count,email_match_count,domain_match_count,name_location_match_count", { count: "exact" })
    .eq("source_type", "lead_generator").order("created_at", { ascending: false });
  if (status && ["pending","approved","rejected"].includes(status)) leadsQuery = leadsQuery.eq("review_status", status);
  if (emailFilter === "has") leadsQuery = leadsQuery.not("email", "is", null).neq("email", "");
  if (emailFilter === "missing") leadsQuery = leadsQuery.or("email.is.null,email.eq.");
  if (duplicatesOnly) leadsQuery = leadsQuery.or("phone_match_count.gt.1,email_match_count.gt.1,domain_match_count.gt.1,name_location_match_count.gt.1");
  if (search) leadsQuery = leadsQuery.or(["company_name","full_name","email","phone","district","business_category"].map(field => field+".ilike.%"+search+"%").join(","));
  const { data: leads, error: leadsError, count } = await leadsQuery.range((page-1)*pageSize, page*pageSize-1);
  if (leadsError) return NextResponse.json({ error: "Could not load the lead review queue. Confirm the contact review view is deployed." }, { status: 500 });
  const [totalCount, emailCount, phoneCount, pendingCount, duplicateCount] = await Promise.all([
    auth.supabase.from("admin_contact_bank").select("id", { count:"exact", head:true }).eq("source_type","lead_generator"),
    auth.supabase.from("admin_contact_bank").select("id", { count:"exact", head:true }).eq("source_type","lead_generator").not("email","is",null).neq("email",""),
    auth.supabase.from("admin_contact_bank").select("id", { count:"exact", head:true }).eq("source_type","lead_generator").not("phone","is",null).neq("phone",""),
    auth.supabase.from("admin_contact_bank").select("id", { count:"exact", head:true }).eq("source_type","lead_generator").eq("review_status","pending"),
    auth.supabase.from("admin_contact_bank_review").select("id", { count:"exact", head:true }).eq("source_type","lead_generator").or("phone_match_count.gt.1,email_match_count.gt.1,domain_match_count.gt.1,name_location_match_count.gt.1"),
  ]);
  return NextResponse.json({
    sources:sources.data||[], jobs:jobs.data||[], discoveryRuns:discoveryRuns.error?[]:discoveryRuns.data||[],
    leads:leads||[], leadPagination:{page,pageSize,total:count||0,pages:Math.max(1,Math.ceil((count||0)/pageSize))},
    leadStats:{total:totalCount.count||0,withEmail:emailCount.count||0,withPhone:phoneCount.count||0,pending:pendingCount.count||0,possibleDuplicates:duplicateCount.count||0}
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  try {
    const body = await request.json();
    if (body.action === "bulk_review_leads") {
      const ids = list(body.ids, 500);
      const status = text(body.status, 20);
      if (!ids.length) throw new Error("Select at least one lead.");
      if (!["approved","rejected"].includes(status)) throw new Error("Choose approve or reject.");
      const { data, error } = await auth.supabase.from("admin_contact_bank")
        .update({ review_status: status, archived_at: null, updated_by: auth.user.id, updated_at: new Date().toISOString() })
        .in("id", ids).eq("source_type","lead_generator")
        .select("id");
      if (error) return NextResponse.json({ error: "Bulk review update failed." }, { status: 500 });
      return NextResponse.json({ updated: data?.length || 0, status });
    }
    if (body.action === "bulk_merge_leads") {
      const ids = list(body.ids, 100);
      if (ids.length < 2) throw new Error("Select at least two duplicate leads to merge.");
      const { data: rows, error: readError } = await auth.supabase.from("admin_contact_bank_review")
        .select("*").in("id", ids).eq("source_type","lead_generator");
      if (readError || !rows || rows.length !== ids.length) throw new Error("Could not load every selected lead.");
      const sorted = [...rows].sort((a,b) => new Date(String(a.created_at)).getTime()-new Date(String(b.created_at)).getTime());
      const keeper = sorted[0] as Record<string, unknown>;
      const duplicates = sorted.slice(1) as Record<string, unknown>[];
      const strongMatch = (a:Record<string,unknown>,b:Record<string,unknown>) => {
        const same = (field:string) => typeof a[field] === "string" && a[field] === b[field];
        return same("normalized_phone") || same("normalized_email") || same("normalized_domain");
      };
      if (duplicates.some(row => !strongMatch(keeper,row))) {
        throw new Error("These records do not all share the same phone, email or website. Name-only matches must be reviewed manually and cannot be auto-merged.");
      }
      const fillFields = ["email","phone","website","website_domain","business_address","city","district","business_category","professional_contact_name","professional_contact_designation"];
      const patch:Record<string,unknown> = { archived_at:null, updated_by:auth.user.id, updated_at:new Date().toISOString() };
      for (const field of fillFields) if (!keeper[field]) {
        const candidate = duplicates.find(row => row[field]);
        if (candidate) patch[field] = candidate[field];
      }
      const { error: keeperError } = await auth.supabase.from("admin_contact_bank").update(patch).eq("id",keeper.id);
      if (keeperError) return NextResponse.json({error:"Could not update the retained lead."},{status:500});
      const now = new Date().toISOString();
      for (const duplicate of duplicates) {
        const mergeNote = "Merged into lead "+keeper.id+" on "+now+". Original source: "+(duplicate.source_url||"not recorded")+".";
        const notes = [duplicate.notes,mergeNote].filter(Boolean).join("\\n").slice(0,4000);
        const { error: archiveError } = await auth.supabase.from("admin_contact_bank").update({
          archived_at:now,review_status:"rejected",notes,updated_by:auth.user.id,updated_at:now
        }).eq("id",duplicate.id);
        if (archiveError) return NextResponse.json({error:"The retained lead was updated, but archiving a duplicate failed. Review the selected records before retrying."},{status:500});
      }
      return NextResponse.json({merged:duplicates.length,retained:keeper.id});
    }
    if (body.action === "add_source") {
      const name = text(body.name, 160);
      if (!name) throw new Error("Source name is required.");
      const sourceUrl = safeHttpsUrl(body.source_url);
      const sourceType = text(body.source_type, 40);
      const allowedTypes = ["government_open_data","trade_association","exhibitor_directory","business_website","licensed_directory","user_provided"];
      if (!allowedTypes.includes(sourceType)) throw new Error("Select a valid source type.");
      if (!body.terms_url) throw new Error("Add the source terms or permission evidence URL before review.");
      const termsUrl = safeHttpsUrl(body.terms_url);
      const feedConfig = validateFeedConfig(body.feed_config);
      const crawlIntervalHours = Number(body.crawl_interval_hours ?? 24);
      if (!Number.isInteger(crawlIntervalHours) || crawlIntervalHours < 24 || crawlIntervalHours > 8760) throw new Error("Crawl interval must be between 24 and 8760 hours.");
      const { data, error } = await auth.supabase.from("lead_generator_sources").insert({
        name, source_url: sourceUrl, source_type: sourceType, terms_url: termsUrl,
        feed_format: "json", feed_config: feedConfig, crawl_interval_hours: crawlIntervalHours,
        permission_status: "pending_review", enabled: false,
        allowed_states: list(body.allowed_states, 40).length ? list(body.allowed_states, 40) : ["Punjab"],
        allowed_categories: list(body.allowed_categories, 80),
        permitted_fields: list(body.permitted_fields, 40).filter(field => allowedFeedFields.has(field)),
        created_by: auth.user.id,
      }).select("*").single();
      if (error) return NextResponse.json({ error: error.code === "23505" ? "This source URL is already registered." : "Could not save source." }, { status: 400 });
      return NextResponse.json({ source: data }, { status: 201 });
    }

    if (body.action === "create_job") {
      const region = text(body.region_state, 80) || "Punjab";
      const districts = list(body.districts, 60);
      const categories = list(body.categories, 80);
      const sourceId = text(body.source_id, 80);
      if (!sourceId) throw new Error("Select an approved, enabled source before queueing a job.");
      if (!categories.length) throw new Error("Select at least one business category.");
      const { data: source, error: sourceError } = await auth.supabase.from("lead_generator_sources")
        .select("id,permission_status,enabled,allowed_states,allowed_categories").eq("id", sourceId).single();
      if (sourceError || !source || source.permission_status !== "approved" || !source.enabled) throw new Error("Only approved and enabled sources can be queued.");
      if (!source.allowed_states.includes(region)) throw new Error("This source is not approved for the selected state.");
      if (source.allowed_categories.length && categories.some(category => !source.allowed_categories.includes(category))) throw new Error("One or more selected categories are outside this source’s approved scope.");
      const { data, error } = await auth.supabase.from("lead_generator_jobs").insert({
        source_id: sourceId, region_state: region, districts, categories,
        collection_mode: "balanced", daily_target: null, created_by: auth.user.id,
      }).select("*").single();
      if (error) return NextResponse.json({ error: "Could not queue discovery job." }, { status: 500 });
      return NextResponse.json({ job: data }, { status: 201 });
    }

    if (body.action === "run_open_map_discovery") {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData, error: sessionError } = await auth.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!projectUrl || !anonKey || sessionError || !accessToken) {
        return NextResponse.json({ error: "Your Super Admin session could not be forwarded to the discovery worker. Please sign in again and retry." }, { status: 503 });
      }
      const response = await fetch(projectUrl.replace(/\/$/, "") + "/functions/v1/open-map-lead-discovery", {
        method: "POST", cache: "no-store",
        headers: { Authorization: "Bearer " + accessToken, apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ force: body.force === true }),
        signal: AbortSignal.timeout(90_000),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 409 && (result as Record<string,unknown>).already_running === true) {
        return NextResponse.json({ status: "skipped", already_running: true, reason: text((result as Record<string,unknown>).reason, 300) || "A discovery run is already in progress." });
      }
      if (!response.ok) return NextResponse.json({ error: text((result as Record<string,unknown>).error, 500) || "Lead discovery invocation failed.", details: result }, { status: response.status });
      return NextResponse.json(result);
    }

    if (body.action === "enrich_websites") {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData, error: sessionError } = await auth.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!projectUrl || !anonKey || sessionError || !accessToken) {
        return NextResponse.json({ error: "Your Super Admin session could not be forwarded to the enrichment worker. Please sign in again and retry." }, { status: 503 });
      }
      const response = await fetch(projectUrl.replace(/\\/$/, "") + "/functions/v1/lead-generator-worker", {
        method: "POST", cache: "no-store",
        headers: { Authorization: "Bearer " + accessToken, apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enrich_websites" }),
        signal: AbortSignal.timeout(120_000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return NextResponse.json({ error: text((result as Record<string,unknown>).error, 500) || "Website enrichment failed.", details: result }, { status: response.status });
      return NextResponse.json(result);
    }

    if (body.action === "run_worker") {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData, error: sessionError } = await auth.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!projectUrl || !anonKey || sessionError || !accessToken) {
        return NextResponse.json({ error: "Your Super Admin session could not be forwarded to the queue worker. Please sign in again and retry." }, { status: 503 });
      }
      const response = await fetch(projectUrl.replace(/\/$/, "") + "/functions/v1/lead-generator-worker", {
        method: "POST", cache: "no-store",
        headers: { Authorization: "Bearer " + accessToken, apikey: anonKey, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(90_000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return NextResponse.json({ error: text((result as Record<string,unknown>).error, 500) || "Worker invocation failed.", details: result }, { status: response.status });
      return NextResponse.json(result);
    }
    throw new Error("Unsupported action.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  try {
    const body = await request.json();
    const id = text(body.id, 80);
    if (!id) throw new Error("Record ID is required.");
    if (body.kind === "source") {
      const permissionStatus = text(body.permission_status, 30);
      if (!["pending_review","approved","rejected","suspended"].includes(permissionStatus)) throw new Error("Invalid source review status.");
      const enabled = body.enabled === true && permissionStatus === "approved";
      const { data, error } = await auth.supabase.from("lead_generator_sources").update({
        permission_status: permissionStatus, enabled, updated_at: new Date().toISOString(),
      }).eq("id", id).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Could not update source." }, { status: 500 });
      return NextResponse.json({ source: data });
    }
    if (body.kind === "job") {
      const status = text(body.status, 20);
      if (!["paused","cancelled"].includes(status)) throw new Error("Only pause or cancel is available from the admin console.");
      const { data, error } = await auth.supabase.from("lead_generator_jobs").update({ status })
        .eq("id", id).in("status", ["queued","running"]).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Could not update job. It may already be finished." }, { status: 409 });
      return NextResponse.json({ job: data });
    }
    throw new Error("Unsupported record type.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
