import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  const { data: isAdmin, error } = await supabase.rpc("is_super_admin");
  if (error || isAdmin !== true) return { error: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { ok: true };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const token = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Hostinger Mail API token is not configured. Add HOSTINGER_MAIL_API_TOKEN to the server environment." }, { status: 503 });
  const base = "https://api.mail.hostinger.com/api/v1";
  const headers = { Authorization: "Bearer " + token, Accept: "application/json" };
  try {
    const accountResponse = await fetch(base + "/me", { headers, cache: "no-store" });
    const account = await accountResponse.json().catch(() => ({}));
    if (!accountResponse.ok) return NextResponse.json({ error: account.error || "Hostinger rejected the API token." }, { status: accountResponse.status });
    const mailboxes = account.data?.mailboxes || [];
    if (!mailboxes.length) return NextResponse.json({ error: "The API token has no mailbox access." }, { status: 404 });
    const mailbox = mailboxes[0];
    const url = new URL(base + "/mailboxes/" + encodeURIComponent(mailbox.resourceId) + "/folders/" + encodeURIComponent(new URL(request.url).searchParams.get("folder") || "INBOX") + "/messages");
    url.searchParams.set("page", new URL(request.url).searchParams.get("page") || "1");
    url.searchParams.set("perPage", "25");
    url.searchParams.set("sort", "-uid");
    const messageResponse = await fetch(url, { headers, cache: "no-store" });
    const messages = await messageResponse.json().catch(() => ({}));
    if (!messageResponse.ok) return NextResponse.json({ error: messages.error || "Could not read the mailbox folder." }, { status: messageResponse.status });
    return NextResponse.json({ address: mailbox.address, mailboxId: mailbox.resourceId, messages: messages.data || [], pagination: messages.pagination || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hostinger Mail API connection failed." }, { status: 502 });
  }
}
