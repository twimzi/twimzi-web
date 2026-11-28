import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  const { data: admin, error } = await supabase.rpc("is_super_admin");
  if (error || admin !== true) return { response: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { supabase, user };
}
const statuses = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;
export async function GET(request: Request) {
  const auth = await getAdmin();
  if ("response" in auth) return auth.response;
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") || "").trim().slice(0, 120);
  const status = params.get("status") || "all";
  let query = auth.supabase.from("support_tickets")
    .select("id,ticket_number,profile_id,business_id,category,priority,status,subject,description,assigned_to,resolution,metadata,resolved_at,closed_at,created_at,updated_at")
    .order("created_at", { ascending: false }).limit(300);
  if (status !== "all" && statuses.includes(status as typeof statuses[number])) query = query.eq("status", status);
  if (q) { const safe = q.replace(/[,%()]/g, " "); query = query.or("subject.ilike.%"+safe+"%,ticket_number.ilike.%"+safe+"%,description.ilike.%"+safe+"%"); }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load support submissions." }, { status: 500 });
  return NextResponse.json({ tickets: (data || []).map((ticket) => ({ ...ticket, requester: { full_name: typeof ticket.metadata?.name === "string" ? ticket.metadata.name : null, email: typeof ticket.metadata?.email === "string" ? ticket.metadata.email : null, phone: null } })) });
}
export async function PATCH(request: Request) {
  const auth = await getAdmin();
  if ("response" in auth) return auth.response;
  try {
    const payload = await request.json() as Record<string, unknown>;
    const id = typeof payload.id === "string" ? payload.id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "A valid ticket ID is required." }, { status: 400 });
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof payload.status === "string") {
      if (!statuses.includes(payload.status as typeof statuses[number])) return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
      changes.status = payload.status;
      changes.resolved_at = payload.status === "resolved" ? new Date().toISOString() : null;
      changes.closed_at = payload.status === "closed" ? new Date().toISOString() : null;
    }
    if (typeof payload.priority === "string") {
      if (!priorities.includes(payload.priority as typeof priorities[number])) return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
      changes.priority = payload.priority;
    }
    if (typeof payload.resolution === "string") changes.resolution = payload.resolution.trim().slice(0, 10000) || null;
    const { data, error } = await auth.supabase.from("support_tickets").update(changes).eq("id", id).select("id,ticket_number,status,priority,resolution,assigned_to,resolved_at,closed_at,updated_at").single();
    if (error || !data) return NextResponse.json({ error: "Could not update this support ticket." }, { status: 500 });
    return NextResponse.json({ ticket: data });
  } catch { return NextResponse.json({ error: "Invalid support ticket update." }, { status: 400 }); }
}