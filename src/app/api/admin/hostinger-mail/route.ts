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

function unwrapCollection(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.messages)) return payload.messages;
  return [];
}

function addressLabel(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(addressLabel).filter(Boolean).join(", ");
  if (typeof value === "object") return [value.name, value.address || value.email].filter(Boolean).join(" <") + (value.address || value.email ? ">" : "");
  return String(value);
}

function normalizeMessage(message: any) {
  return {
    ...message,
    uid: message?.uid ?? message?.id,
    subject: message?.subject || "(No subject)",
    from: addressLabel(message?.from || message?.sender),
    to: addressLabel(message?.to),
    date: message?.date || message?.internalDate || "",
    snippet: message?.snippet || message?.preview || "",
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const token = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Hostinger Mail API token is not configured on the running server." }, { status: 503 });
  const base = "https://api.mail.hostinger.com/api/v1";
  const headers = { Authorization: "Bearer " + token, Accept: "application/json" };

  try {
    const accountResponse = await fetch(base + "/me", { headers, cache: "no-store" });
    const account = await accountResponse.json().catch(() => ({}));
    if (!accountResponse.ok) return NextResponse.json({ error: account.error || account.message || "Hostinger rejected the API token." }, { status: accountResponse.status });

    const mailboxes = account?.data?.mailboxes || [];
    if (!mailboxes.length) return NextResponse.json({ error: "The API token has no mailbox access." }, { status: 404 });
    const mailbox = mailboxes[0];
    const params = new URL(request.url).searchParams;
    const requestedFolder = params.get("folder") || "INBOX";
    const uid = params.get("uid");

    // Discover the mailbox's real folder paths; do not assume a Sent folder name.
    const foldersUrl = new URL(base + "/mailboxes/" + encodeURIComponent(mailbox.resourceId) + "/folders");
    foldersUrl.searchParams.set("page", "1");
    foldersUrl.searchParams.set("perPage", "100");
    const foldersResponse = await fetch(foldersUrl, { headers, cache: "no-store" });
    const foldersPayload = await foldersResponse.json().catch(() => ({}));
    if (!foldersResponse.ok) {
      return NextResponse.json({ error: foldersPayload.error || foldersPayload.message || "Hostinger could not list mailbox folders." }, { status: foldersResponse.status });
    }
    const folders = unwrapCollection(foldersPayload);
    const sentFolder = folders.find((item: any) => String(item.specialUse || item.special_use || "").toLowerCase().includes("sent"))
      || folders.find((item: any) => /(^|[.])sent$/i.test(String(item.path || item.name || "")));
    const inboxFolder = folders.find((item: any) => String(item.path || item.name || "").toUpperCase() === "INBOX");
    const folder = /^(sent|inbox\.sent)$/i.test(requestedFolder)
      ? (sentFolder?.path || sentFolder?.name || "INBOX.Sent")
      : (inboxFolder?.path || inboxFolder?.name || requestedFolder);

    const messagePath = "/mailboxes/" + encodeURIComponent(mailbox.resourceId) + "/folders/" + encodeURIComponent(folder) + "/messages";
    const messageUrl = new URL(base + messagePath + (uid ? "/" + encodeURIComponent(uid) : ""));
    if (!uid) {
      messageUrl.searchParams.set("page", params.get("page") || "1");
      messageUrl.searchParams.set("perPage", "25");
      messageUrl.searchParams.set("sort", "-uid");
    }
    const messageResponse = await fetch(messageUrl, { headers, cache: "no-store" });
    const payload = await messageResponse.json().catch(() => ({}));
    if (!messageResponse.ok) {
      return NextResponse.json({ error: payload.error || payload.message || "Could not read the mailbox folder.", folder, availableFolders: folders.map((item: any) => item.path || item.name).filter(Boolean) }, { status: messageResponse.status });
    }

    if (uid) {
      const message = payload?.data || payload;
      const textUrl = new URL(messageUrl.toString() + "/text");
      const textResponse = await fetch(textUrl, { headers, cache: "no-store" });
      const textPayload = textResponse.ok ? await textResponse.json().catch(() => ({})) : {};
      const textData = textPayload?.data || textPayload;
      const normalized = normalizeMessage(message);
      normalized.text = textData?.text || "";
      normalized.html = textData?.html || "";
      return NextResponse.json({ address: mailbox.address, mailboxId: mailbox.resourceId, folder, messages: normalized });
    }

    const messages = unwrapCollection(payload).map(normalizeMessage);
    return NextResponse.json({
      address: mailbox.address,
      mailboxId: mailbox.resourceId,
      folder,
      folders: folders.map((item: any) => ({ path: item.path || item.name, specialUse: item.specialUse || item.special_use || null, messageCount: item.messageCount ?? item.message_count ?? null })),
      messages,
      pagination: payload?.pagination || payload?.data?.pagination || null,
      count: messages.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hostinger Mail API connection failed." }, { status: 502 });
  }
}
