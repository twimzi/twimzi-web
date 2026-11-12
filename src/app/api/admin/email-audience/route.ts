import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: admin } = await supabase.rpc("is_super_admin");
  if (admin !== true) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { data: preferences, error: preferenceError } = await supabase
    .from("email_preferences")
    .select("email")
    .eq("marketing_consent", true)
    .is("unsubscribed_at", null);
  if (preferenceError) return NextResponse.json({ error: "Could not load opted-in audience." }, { status: 500 });
  const optedInEmails = Array.from(new Set((preferences || []).map((item) => String(item.email).toLowerCase())));
  if (!optedInEmails.length) return NextResponse.json({ recipients: [], count: 0 });

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .in("email", optedInEmails);
  if (error) return NextResponse.json({ error: "Could not load registered user details." }, { status: 500 });

  const recipients = (profiles || []).map((profile) => ({
    email: String(profile.email || "").toLowerCase(),
    name: profile.full_name || "Twimzi member",
  })).filter((item) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(item.email));
  return NextResponse.json({ recipients, count: recipients.length });
}
