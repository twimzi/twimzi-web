import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: admin } = await supabase.rpc("is_super_admin");
  if (admin !== true) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

  const { data, error } = await supabase
    .from("email_campaigns")
    .select("id,name,subject,campaign_type,status,scheduled_at,created_at,completed_at,total_recipients,accepted_count,failed_count")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Campaign history could not be loaded." }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}
