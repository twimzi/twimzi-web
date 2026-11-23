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

function safeHttpsUrl(value: unknown) {
  const raw = text(value, 1000);
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid source URL."); }
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Sources must use HTTPS and cannot contain embedded credentials.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "127.0.0.1" || host === "::1" || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error("Private or local network URLs are not permitted.");
  return url.toString();
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const [sources, jobs] = await Promise.all([
    auth.supabase.from("lead_generator_sources").select("*").order("created_at", { ascending: false }).limit(250),
    auth.supabase.from("lead_generator_jobs").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (sources.error || jobs.error) return NextResponse.json({ error: "Could not load lead generator data. Apply the lead generator migration first." }, { status: 500 });
  return NextResponse.json({ sources: sources.data || [], jobs: jobs.data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  try {
    const body = await request.json();
    if (body.action === "add_source") {
      const name = text(body.name, 160);
      if (!name) throw new Error("Source name is required.");
      const sourceUrl = safeHttpsUrl(body.source_url);
      const sourceType = text(body.source_type, 40);
      const allowedTypes = ["government_open_data","trade_association","exhibitor_directory","business_website","licensed_directory","user_provided"];
      if (!allowedTypes.includes(sourceType)) throw new Error("Select a valid source type.");
      const termsUrl = body.terms_url ? safeHttpsUrl(body.terms_url) : null;
      const { data, error } = await auth.supabase.from("lead_generator_sources").insert({
        name, source_url: sourceUrl, source_type: sourceType, terms_url: termsUrl,
        permission_status: "pending_review", enabled: false,
        allowed_states: list(body.allowed_states, 40).length ? list(body.allowed_states, 40) : ["Punjab"],
        allowed_categories: list(body.allowed_categories, 80),
        permitted_fields: list(body.permitted_fields, 40).length ? list(body.permitted_fields, 40) : ["business_name","category","business_email","business_phone","website","address","city","district","state"],
        created_by: auth.user.id,
      }).select("*").single();
      if (error) return NextResponse.json({ error: error.code === "23505" ? "This source URL is already registered." : "Could not save source." }, { status: 400 });
      return NextResponse.json({ source: data }, { status: 201 });
    }
    if (body.action === "create_job") {
      const region = text(body.region_state, 80) || "Punjab";
      const districts = list(body.districts, 60);
      const categories = list(body.categories, 80);
      if (!categories.length) throw new Error("Select at least one business category.");
      const sourceId = text(body.source_id, 80) || null;
      if (sourceId) {
        const { data: source, error } = await auth.supabase.from("lead_generator_sources").select("id,permission_status,enabled,allowed_states").eq("id", sourceId).single();
        if (error || !source || source.permission_status !== "approved" || !source.enabled) throw new Error("Only approved and enabled sources can be queued.");
        if (!source.allowed_states.includes(region)) throw new Error("This source is not approved for the selected state.");
      }
      const { data, error } = await auth.supabase.from("lead_generator_jobs").insert({
        source_id: sourceId, region_state: region, districts, categories,
        collection_mode: "balanced", daily_target: null, created_by: auth.user.id,
      }).select("*").single();
      if (error) return NextResponse.json({ error: "Could not queue discovery job." }, { status: 500 });
      return NextResponse.json({ job: data }, { status: 201 });
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
      const { data, error } = await auth.supabase.from("lead_generator_jobs").update({ status }).eq("id", id).in("status", ["queued","running"]).select("*").single();
      if (error || !data) return NextResponse.json({ error: "Could not update job. It may already be finished." }, { status: 409 });
      return NextResponse.json({ job: data });
    }
    throw new Error("Unsupported record type.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
