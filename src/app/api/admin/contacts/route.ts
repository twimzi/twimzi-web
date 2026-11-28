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
    contact_type: ["business","manufacturer","trader","professional","supplier","customer","partner","other"].includes(String(payload.contact_type)) ? String(payload.contact_type) : "other",
    source: clean(payload.source, 180) || null, source_type: ["manual_contact_add", "lead_generator", "user_self_register"].includes(String(payload.source_type)) ? String(payload.source_type) : "manual_contact_add", tags, notes: clean(payload.notes, 5000) || null,
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
  const sourceType = clean(url.searchParams.get("sourceType"), 40);
  const requestedPage = Number(url.searchParams.get("page") || "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 500;
  const from = (page - 1) * pageSize;
  let query = auth.supabase.from("admin_contact_bank").select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id", { ascending: false });
  query = includeArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (sourceType && sourceType !== "all") query = query.eq("source_type", sourceType);
  const contactTypes = (url.searchParams.get("contactTypes") || "").split(",").filter((value) => ["business","manufacturer","trader","professional","supplier","customer","partner","other"].includes(value));
  if (contactTypes.length) query = query.in("contact_type", contactTypes);
  const emailConsent = url.searchParams.get("emailConsent");
  if (emailConsent === "true" || emailConsent === "false") query = query.eq("email_marketing_consent", emailConsent === "true");
  const whatsappConsent = url.searchParams.get("whatsappConsent");
  if (whatsappConsent === "true" || whatsappConsent === "false") query = query.eq("whatsapp_marketing_consent", whatsappConsent === "true");
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[,%()]/g, " ")}%,company_name.ilike.%${q.replace(/[,%()]/g, " ")}%,email.ilike.%${q.replace(/[,%()]/g, " ")}%,phone.ilike.%${q.replace(/[,%()]/g, " ")}%`);
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) return NextResponse.json({ error: "Could not load contacts." }, { status: 500 });
  const total = count || 0;
  return NextResponse.json({ contacts: data || [], pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } });
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
    if (payload.action === "bulk-consent") {
      const ids = Array.isArray(payload.ids) ? Array.from(new Set(payload.ids.filter((id: unknown): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))).slice(0, 500) : [];
      const changes = payload.changes && typeof payload.changes === "object" ? payload.changes as Record<string, unknown> : {};
      const hasEmail = typeof changes.email_marketing_consent === "boolean";
      const hasWhatsapp = typeof changes.whatsapp_marketing_consent === "boolean";
      if (!ids.length || (!hasEmail && !hasWhatsapp)) return NextResponse.json({ error: "Select contacts and at least one consent change." }, { status: 400 });
      const updatedIds = new Set<string>();
      const baseUpdate = { updated_by: auth.user.id, updated_at: new Date().toISOString() };
      if (hasEmail) {
        let emailQuery = auth.supabase.from("admin_contact_bank").update({ ...baseUpdate, email_marketing_consent: changes.email_marketing_consent, email_consent_at: changes.email_marketing_consent ? new Date().toISOString() : null }).in("id", ids).is("archived_at", null).or("do_not_contact.is.null,do_not_contact.eq.false");
        if (changes.email_marketing_consent === true) emailQuery = emailQuery.is("email_unsubscribed_at", null).not("email", "is", null);
        const { data, error } = await emailQuery.select("id");
        if (error) return NextResponse.json({ error: "Email consent update failed." }, { status: 500 });
        for (const row of data || []) updatedIds.add(row.id);
      }
      if (hasWhatsapp) {
        let whatsappQuery = auth.supabase.from("admin_contact_bank").update({ ...baseUpdate, whatsapp_marketing_consent: changes.whatsapp_marketing_consent, whatsapp_consent_at: changes.whatsapp_marketing_consent ? new Date().toISOString() : null }).in("id", ids).is("archived_at", null).or("do_not_contact.is.null,do_not_contact.eq.false");
        if (changes.whatsapp_marketing_consent === true) whatsappQuery = whatsappQuery.is("whatsapp_opted_out_at", null).not("phone", "is", null);
        const { data, error } = await whatsappQuery.select("id");
        if (error) return NextResponse.json({ error: "WhatsApp consent update failed." }, { status: 500 });
        for (const row of data || []) updatedIds.add(row.id);
      }
      return NextResponse.json({ updated: updatedIds.size, skipped: ids.length - updatedIds.size });
    }
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
