import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: admin } = await supabase.rpc("is_super_admin");
  if (admin !== true) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const [{ data: preferences, error: preferenceError }, { data: contacts, error: contactError }] = await Promise.all([
    supabase.from("email_preferences").select("email,marketing_consent,unsubscribed_at"),
    supabase.from("admin_contact_bank")
      .select("full_name,company_name,email,contact_type,city,state,country,email_marketing_consent,email_unsubscribed_at,do_not_contact,archived_at")
      .not("email", "is", null),
  ]);
  if (preferenceError || contactError) {
    return NextResponse.json({ error: "Could not verify the opted-in audience and suppression records." }, { status: 500 });
  }

  const preferenceByEmail = new Map((preferences ?? []).map((item) => [String(item.email).trim().toLowerCase(), item]));
  const contactRowsByEmail = new Map<string, NonNullable<typeof contacts>>();
  for (const contact of contacts ?? []) {
    const email = String(contact.email || "").trim().toLowerCase();
    if (!email) continue;
    const rows = contactRowsByEmail.get(email) ?? [];
    rows.push(contact);
    contactRowsByEmail.set(email, rows);
  }

  const recipients = new Map<string, {
    email: string; name: string; company: string; contactType: string;
    city: string; state: string; country: string;
  }>();
  for (const [email, rows] of contactRowsByEmail) {
    const preference = preferenceByEmail.get(email);
    const hasOptIn = rows.some((row) => row.email_marketing_consent === true);
    const suppressed = rows.some((row) => row.email_unsubscribed_at || row.do_not_contact || row.archived_at);
    if (!hasOptIn || suppressed || preference?.unsubscribed_at) continue;
    const contact = rows[0];
    recipients.set(email, {
      email,
      name: rows.find((row) => row.full_name)?.full_name || "there",
      company: contact.company_name || "",
      contactType: contact.contact_type || "other",
      city: contact.city || "",
      state: contact.state || "",
      country: contact.country || "",
    });
  }

  // Keep preference-only subscribers supported, but never re-add an address
  // that has a contact-bank record (including a suppressed one).
  for (const [email, preference] of preferenceByEmail) {
    if (recipients.has(email) || preference.marketing_consent !== true || preference.unsubscribed_at) continue;
    if (contactRowsByEmail.has(email)) continue;
    recipients.set(email, { email, name: "there", company: "", contactType: "other", city: "", state: "", country: "" });
  }

  return NextResponse.json({ recipients: Array.from(recipients.values()), count: recipients.size });
}
