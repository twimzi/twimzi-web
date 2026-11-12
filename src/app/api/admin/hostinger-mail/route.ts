import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

function unwrapCollection(payload: unknown): ApiRecord[] {
  const record = asRecord(payload);
  const data = record.data;
  const nestedData = asRecord(data).data;
  const candidates = [payload, data, nestedData, record.messages];
  const collection = candidates.find(Array.isArray);
  return Array.isArray(collection) ? collection.map(asRecord) : [];
}

function addressLabel(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(addressLabel).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const address = asRecord(value);
    const name = typeof address.name === "string" ? address.name : "";
    const email = typeof address.address === "string"
      ? address.address
      : typeof address.email === "string"
        ? address.email
        : "";
    return [name, email].filter(Boolean).join(" <") + (email ? ">" : "");
  }
  return String(value);
}

function normalizeMessage(message: ApiRecord): ApiRecord {
  return {
    ...message,
    uid: message.uid ?? message.id,
    subject: message.subject || "(No subject)",
    from: addressLabel(message.from || message.sender),
    to: addressLabel(message.to),
    date: message.date || message.internalDate || "",
    snippet: message.snippet || message.preview || "",
  };
}

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
  if (!token) return NextResponse.json({ error: "Hostinger Mail API token is not configured on the running server." }, { status: 503 });
  const base = "https://api.mail.hostinger.com/api/v1";
  const headers = { Authorization: "Bearer " + token, Accept: "application/json" };

  try {
    const accountResponse = await fetch(base + "/me", { headers, cache: "no-store" });
    const account = asRecord(await accountResponse.json().catch(() => ({})));
    if (!accountResponse.ok) {
      return NextResponse.json({ error: account.error || account.message || "Hostinger rejected the API token." }, { status: accountResponse.status });
    }

    const accountData = asRecord(account.data);
    const mailboxes = Array.isArray(accountData.mailboxes) ? accountData.mailboxes.map(asRecord) : [];
    if (!mailboxes.length) return NextResponse.json({ error: "The API token has no mailbox access." }, { status: 404 });
    const mailbox = mailboxes[0];
    const mailboxId = String(mailbox.resourceId || "");
    const mailboxAddress = typeof mailbox.address === "string" ? mailbox.address : "";
    const params = new URL(request.url).searchParams;
    const requestedFolder = params.get("folder") || "INBOX";
    const uid = params.get("uid");

    // Discover the mailbox's real folder paths; do not assume a Sent folder name.
    const foldersUrl = new URL(base + "/mailboxes/" + encodeURIComponent(mailboxId) + "/folders");
    foldersUrl.searchParams.set("page", "1");
    foldersUrl.searchParams.set("perPage", "100");
    const foldersResponse = await fetch(foldersUrl, { headers, cache: "no-store" });
    const foldersPayload = asRecord(await foldersResponse.json().catch(() => ({})));
    if (!foldersResponse.ok) {
      return NextResponse.json({ error: foldersPayload.error || foldersPayload.message || "Hostinger could not list mailbox folders." }, { status: foldersResponse.status });
    }
    const folders = unwrapCollection(foldersPayload);
    const sentFolder = folders.find((item) => String(item.specialUse || item.special_use || "").toLowerCase().includes("sent"))
      || folders.find((item) => /(^|[.])sent$/i.test(String(item.path || item.name || "")));
    const inboxFolder = folders.find((item) => String(item.path || item.name || "").toUpperCase() === "INBOX");
    const folder = /^(sent|inbox\.sent)$/i.test(requestedFolder)
      ? String(sentFolder?.path || sentFolder?.name || "INBOX.Sent")
      : String(inboxFolder?.path || inboxFolder?.name || requestedFolder);

    const messagePath = "/mailboxes/" + encodeURIComponent(mailboxId) + "/folders/" + encodeURIComponent(folder) + "/messages";
    const messageUrl = new URL(base + messagePath + (uid ? "/" + encodeURIComponent(uid) : ""));
    if (!uid) {
      messageUrl.searchParams.set("page", params.get("page") || "1");
      messageUrl.searchParams.set("perPage", "25");
      messageUrl.searchParams.set("sort", "-uid");
    }
    const messageResponse = await fetch(messageUrl, { headers, cache: "no-store" });
    const payload = asRecord(await messageResponse.json().catch(() => ({})));
    if (!messageResponse.ok) {
      return NextResponse.json({
        error: payload.error || payload.message || "Could not read the mailbox folder.",
        folder,
        availableFolders: folders.map((item) => item.path || item.name).filter(Boolean),
      }, { status: messageResponse.status });
    }

    if (uid) {
      const message = asRecord(payload.data || payload);
      const textUrl = new URL(messageUrl.toString() + "/text");
      const textResponse = await fetch(textUrl, { headers, cache: "no-store" });
      const textPayload = asRecord(textResponse.ok ? await textResponse.json().catch(() => ({})) : {});
      const textData = asRecord(textPayload.data || textPayload);
      const normalized = normalizeMessage(message);
      normalized.text = textData.text || "";
      normalized.html = textData.html || "";
      return NextResponse.json({ address: mailboxAddress, mailboxId, folder, messages: normalized });
    }

    const messages = unwrapCollection(payload).map(normalizeMessage);
    return NextResponse.json({
      address: mailboxAddress,
      mailboxId,
      folder,
      folders: folders.map((item) => ({
        path: item.path || item.name,
        specialUse: item.specialUse || item.special_use || null,
        messageCount: item.messageCount ?? item.message_count ?? null,
      })),
      messages,
      pagination: payload.pagination || asRecord(payload.data).pagination || null,
      count: messages.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hostinger Mail API connection failed." }, { status: 502 });
  }
}
