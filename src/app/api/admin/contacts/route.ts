import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function adminClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  const { data: admin, error } = await supabase.rpc("is_super_admin");
  if (error || admin !== true) return { error: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { supabase, user };
}

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
function normalize(payload: Record<string, unknown>) {
  const full_name = clean(payload.full_name, 160);
  const email = clean(payload.email, 254).toLowerCase();
  const phone = clean(payload.phone, 40);
  if (!full_name) throw new Error("Contact name is required.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (phone && phone.replace(/\D/g, "").length < 7) throw new Error("Enter a valid phone number.");
  const tags = Array.isArray(payload.tags) ? payload.tags.map((tag) => clean(tag, 40)).filter(Boolean).slice(0, 30) : clean(payload.tags, 500).split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 30);
  const emailConsent = payload.email_marketing_consent === true;
  const whatsappConsent = payload.whatsapp_marketing_consent === true;
  return {
    full_name, company_name: clean(payload.company_name, 180) || null, email: email || null, phone: phone || null,
    city: clean(payload.city, 100) || null, state: clean(payload.state, 100) || null, country: clean(payload.country, 100) || null,
    contact_type: ["business","manufacturer","trader","professional","supplier","customer","partner","other"].includes(String(payload.contact_type)) ? payload.contact_type : "other",
    source: clean(payload.source, 180) || null, tags, notes: clean(payload.notes, 5000) || null,
    email_marketing_consent: emailConsent, email_consent_at: emailConsent ? clean(payload.email_consent_at, 80) || new Date().toISOString() : null,
    whatsapp_marketing_consent: whatsappConsent, whatsapp_consent_at: whatsappConsent ? clean(payload.whatsapp_consent_at, 80) || new Date().toISOString() : null,
  };
}

export async function GET(request: Request) {
  const auth = await adminClient();
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 120);
  const includeArchived = url.searchParams.get("archived") === "true";
  let query = auth.supabase.from("admin_contact_bank").select("*").order("created_at", { ascending: false }).limit(500);
  query = includeArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[,%()]/g, " ")}%,company_name.ilike.%${q.replace(/[,%()]/g, " ")}%,email.ilike.%${q.replace(/[,%()]/g, " ")}%,phone.ilike.%${q.replace(/[,%()]/g, " ")}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load contacts." }, { status: 500 });
  return NextResponse.json({ contacts: data || [] });
}

export async function POST(request: Request) {
  const auth = await adminClient();
  if ("error" in auth) return auth.error;
  try {
    const payload = await request.json();
    const record = normalize(payload);
    const { data: duplicates } = await auth.supabase.from("admin_contact_bank").select("id,full_name,email,phone").is("archived_at", null);
    const duplicate = (duplicates || []).find((item) => (record.email && item.email?.toLowerCase() === record.email) || (record.phone && item.phone?.replace(/\D/g, "") === record.phone?.replace(/\D/g, "")));
    if (duplicate) return NextResponse.json({ error: "A contact with the same email or phone already exists.", duplicate }, { status: 409 });
    const { data, error } = await auth.supabase.from("admin_contact_bank").insert({ ...record, created_by: auth.user.id, updated_by: auth.user.id }).select("*").single();
    if (error) return NextResponse.json({ error: "Contact could not be saved." }, { status: 500 });
    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid contact." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await adminClient();
  if ("error" in auth) return auth.error;
  try {
    const payload = await request.json();
    const id = clean(payload.id, 80);
    if (!id) return NextResponse.json({ error: "Contact ID is required." }, { status: 400 });
    const record = normalize(payload);
    const { data: duplicateRows } = await auth.supabase.from("admin_contact_bank").select("id,email,phone").neq("id", id).is("archived_at", null);
    const duplicate = (duplicateRows || []).find((item) => (record.email && item.email?.toLowerCase() === record.email) || (record.phone && item.phone?.replace(/\D/g, "") === record.phone?.replace(/\D/g, "")));
    if (duplicate) return NextResponse.json({ error: "Another contact already uses this email or phone." }, { status: 409 });
    const { data, error } = await auth.supabase.from("admin_contact_bank").update({ ...record, updated_by: auth.user.id, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error || !data) return NextResponse.json({ error: "Contact could not be updated." }, { status: 500 });
    return NextResponse.json({ contact: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid contact." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await adminClient();
  if ("error" in auth) return auth.error;
  const payload = await request.json();
  const id = clean(payload.id, 80);
  if (!id) return NextResponse.json({ error: "Contact ID is required." }, { status: 400 });
  const { error } = await auth.supabase.from("admin_contact_bank").update({ archived_at: new Date().toISOString(), updated_by: auth.user.id, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Contact could not be archived." }, { status: 500 });
  return NextResponse.json({ success: true });
}
