import tls from "node:tls";
import { createHmac } from "node:crypto";
import { createInterface } from "node:readline";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SmtpConnection = {
  write: (value: string) => void;
  nextResponse: () => Promise<string>;
  close: () => void;
};

function createSmtpConnection(socket: tls.TLSSocket): SmtpConnection {
  const reader = createInterface({ input: socket });
  const lines: string[] = [];
  const waiters: Array<(line: string) => void> = [];
  reader.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter) waiter(line);
    else lines.push(line);
  });
  return {
    write: (value) => socket.write(value),
    nextResponse: async () => {
      const first = lines.length ? lines.shift()! : await new Promise<string>((resolve) => waiters.push(resolve));
      const code = first.slice(0, 3);
      let response = first;
      if (first[3] === "-") {
        while (true) {
          const line = lines.length ? lines.shift()! : await new Promise<string>((resolve) => waiters.push(resolve));
          response += "\n" + line;
          if (line.startsWith(code + " ")) break;
        }
      }
      return response;
    },
    close: () => { reader.close(); socket.end(); },
  };
}

async function expect(connection: SmtpConnection, expected: string[]) {
  const response = await connection.nextResponse();
  const code = response.slice(0, 3);
  if (!expected.includes(code)) throw new Error("SMTP server rejected a command (" + code + ").");
  return response;
}

function encodeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeSubject(value: string) {
  const clean = encodeHeader(value);
  return /^[\x20-\x7E]*$/.test(clean) ? clean : "=?UTF-8?B?" + Buffer.from(clean, "utf8").toString("base64") + "?=";
}



function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character] || character);
}

function buildBrandedHtml(subject: string, body: string) {
  const paragraphs = body.split(/\n\n+/).map((part) =>
    "<p style=\"margin:0 0 18px;color:#475569;font-size:15px;line-height:1.8\">" +
    part.split("\n").map(escapeEmailHtml).join("<br>") + "</p>"
  ).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f1f5f9"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="padding:24px 32px;background:#0d9488;color:#fff;font-size:25px;font-weight:800">twimzi</td></tr><tr><td style="padding:34px 32px"><h1 style="margin:0 0 22px;color:#0f172a;font-size:22px">${escapeEmailHtml(subject)}</h1>${paragraphs}<p style="margin-top:28px;color:#64748b;font-size:12px">© ${new Date().getFullYear()} Twimzi · <a href="https://www.twimzi.com" style="color:#0d9488">www.twimzi.com</a></p></td></tr></table></td></tr></table></body></html>`;
}

async function sendViaHostinger(to: string, subject: string, body: string, html: string) {
  const host = process.env.HOSTINGER_SMTP_HOST;
  const port = Number(process.env.HOSTINGER_SMTP_PORT || "465");
  const user = process.env.HOSTINGER_SMTP_USER;
  const pass = process.env.HOSTINGER_SMTP_PASS;
  const from = process.env.HOSTINGER_SMTP_FROM || user;

  if (!host || !user || !pass || !from || !Number.isInteger(port) || port !== 465) {
    throw new Error("Hostinger SMTP is not configured. Set HOSTINGER_SMTP_HOST, HOSTINGER_SMTP_PORT=465, HOSTINGER_SMTP_USER, HOSTINGER_SMTP_PASS and HOSTINGER_SMTP_FROM in the hosting environment.");
  }

  const socket = tls.connect({ host, port, servername: host, timeout: 15000 });
  await new Promise<void>((resolve, reject) => {
    socket.once("secureConnect", resolve);
    socket.once("error", reject);
    socket.once("timeout", () => reject(new Error("SMTP connection timed out.")));
  });

  const connection = createSmtpConnection(socket);
  try {
    await expect(connection, ["220"]);
    connection.write("EHLO twimzi.com\r\n");
    await expect(connection, ["250"]);
    connection.write("AUTH LOGIN\r\n");
    await expect(connection, ["334"]);
    connection.write(Buffer.from(user).toString("base64") + "\r\n");
    await expect(connection, ["334"]);
    connection.write(Buffer.from(pass).toString("base64") + "\r\n");
    await expect(connection, ["235"]);
    connection.write("MAIL FROM:<" + encodeHeader(from) + ">\r\n");
    await expect(connection, ["250"]);
    connection.write("RCPT TO:<" + encodeHeader(to) + ">\r\n");
    await expect(connection, ["250", "251"]);
    connection.write("DATA\r\n");
    await expect(connection, ["354"]);
    const boundary = "twimzi-alt-" + Date.now().toString(16) + "-" + Buffer.from(to).toString("hex").slice(0, 12);
    const encodePart = (value: string) => Buffer.from(value, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trimEnd();
    const message = [
      "From: " + encodeHeader(from),
      "To: " + encodeHeader(to),
      "Subject: " + encodeSubject(subject),
      "MIME-Version: 1.0",
      "Content-Type: multipart/alternative; boundary=\""+boundary+"\"",
      "",
      "--" + boundary,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodePart(body),
      "--" + boundary,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      encodePart(html),
      "--" + boundary + "--",
      ".",
      "",
    ].join("\r\n");
    connection.write(message + "\r\n");
    await expect(connection, ["250"]);
    // A 250 response after DATA means the SMTP server accepted the message.
    // Do not mark it failed if the server closes during the optional QUIT exchange.
    connection.write("QUIT\r\n");
  } finally {
    connection.close();
  }
}

export async function POST(request: Request) {
  try {
    const internalSecret = process.env.EMAIL_AUTOMATION_CRON_SECRET;
    const isInternal = !!internalSecret && request.headers.get("authorization") === `Bearer ${internalSecret}`;
    if (isInternal && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured for the automation worker." }, { status: 503 });
    }
    const supabase = isInternal
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
      : await createSupabaseServerClient();
    const { data: { user } } = isInternal ? { data: { user: null } } : await supabase.auth.getUser();
    if (!isInternal) {
      if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
      const { data: isSuperAdmin, error: roleError } = await supabase.rpc("is_super_admin");
      if (roleError || isSuperAdmin !== true) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
    }

    const payload = await request.json();
    const rawRecipients: unknown = payload.recipients ?? (typeof payload.to === "string" ? [payload.to] : []);
    if (!Array.isArray(rawRecipients) || rawRecipients.length < 1 || rawRecipients.length > 25 || !rawRecipients.every((item) => typeof item === "string")) {
      return NextResponse.json({ error: "Provide between 1 and 25 recipient email addresses per batch." }, { status: 400 });
    }
    const recipients = Array.from(new Set((rawRecipients as string[]).map((email) => email.trim().toLowerCase())));
    if (recipients.some((email) => email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "One or more recipient email addresses are invalid." }, { status: 400 });
    }
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const suppliedHtml = typeof payload.html === "string" ? payload.html.trim() : "";
    const campaignName = typeof payload.campaignName === "string" ? payload.campaignName.trim().slice(0, 120) : "Email campaign";
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
      return NextResponse.json({ error: "Enter a subject of up to 200 characters." }, { status: 400 });
    }
    if (!body || body.length > 20000 || suppliedHtml.length > 60000) {
      return NextResponse.json({ error: "Enter a message up to 20,000 characters and HTML up to 60,000 characters." }, { status: 400 });
    }
    const html = suppliedHtml || buildBrandedHtml(subject, body);

    const campaignType = payload.campaignType === "transactional" ? "transactional" : "marketing";
    const unsubscribeSecret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.EMAIL_AUTOMATION_CRON_SECRET;
    if (campaignType === "marketing" && !unsubscribeSecret) {
      return NextResponse.json({ error: "Marketing unsubscribe signing is not configured. Set EMAIL_UNSUBSCRIBE_SECRET in Hostinger environment variables." }, { status: 503 });
    }
    if (campaignType === "marketing" && payload.consentConfirmed !== true) {
      return NextResponse.json({ error: "Confirm that every marketing recipient has opted in to receive Twimzi emails. Unsubscribed addresses will always be suppressed." }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({ name: campaignName, subject, body, campaign_type: campaignType, status: "sending", created_by: user?.id ?? null, started_at: new Date().toISOString(), total_recipients: recipients.length })
      .select("id")
      .single();
    if (campaignError || !campaign) {
      console.error("[admin/send-email] campaign log insert failed", campaignError?.message);
      return NextResponse.json({ error: "Campaign history could not be saved. No email was sent." }, { status: 500 });
    }

    const { data: preferences, error: preferenceError } = await supabase
      .from("email_preferences")
      .select("email,marketing_consent,unsubscribed_at")
      .in("email", recipients);
    if (preferenceError) {
      await supabase.from("email_campaigns").update({ status: "failed", failed_count: recipients.length, completed_at: new Date().toISOString() }).eq("id", campaign.id);
      return NextResponse.json({ error: "Recipient suppression checks failed. No emails were sent." }, { status: 500 });
    }
    const { data: contactRows, error: contactError } = await supabase
      .from("admin_contact_bank")
      .select("email,email_marketing_consent,email_unsubscribed_at,do_not_contact,archived_at")
      .in("email", recipients);
    if (contactError) {
      await supabase.from("email_campaigns").update({ status: "failed", failed_count: recipients.length, completed_at: new Date().toISOString() }).eq("id", campaign.id);
      return NextResponse.json({ error: "Contact consent and suppression checks failed. No emails were sent." }, { status: 500 });
    }

    const preferenceByEmail = new Map((preferences ?? []).map((row) => [String(row.email).toLowerCase(), row]));
    const contactRowsByEmail = new Map<string, typeof contactRows>();
    for (const row of contactRows ?? []) {
      const key = String(row.email || "").toLowerCase();
      const existing = contactRowsByEmail.get(key) ?? [];
      existing.push(row);
      contactRowsByEmail.set(key, existing);
    }
    const eligibleRecipients = recipients.filter((email) => {
      if (campaignType === "transactional") return true;
      const preference = preferenceByEmail.get(email);
      if (preference?.unsubscribed_at) return false;
      const contactRecords = contactRowsByEmail.get(email);
      if (contactRecords?.length) {
        return contactRecords.some((row) => row.email_marketing_consent === true)
          && !contactRecords.some((row) => row.email_unsubscribed_at || row.do_not_contact || row.archived_at);
      }
      return preference?.marketing_consent === true;
    });
    const suppressedRecipients = recipients.filter((email) => !eligibleRecipients.includes(email));
    if (suppressedRecipients.length) {
      await supabase.from("email_campaign_recipients").insert(suppressedRecipients.map((email) => ({
        campaign_id: campaign.id, email, status: "suppressed", error_message: "No valid recorded marketing opt-in, or recipient is unsubscribed / suppressed."
      })));
    }
    if (eligibleRecipients.length) {
      await supabase.from("email_campaign_recipients").insert(eligibleRecipients.map((email) => ({
        campaign_id: campaign.id, email, status: "queued"
      })));
    }

    let sent = 0;
    const failed: string[] = [];
    for (const recipient of eligibleRecipients) {
      try {
        let personalizedBody = body.replace(/\{\{name\}\}/g, "there");
        if (campaignType === "marketing" && unsubscribeSecret) {
          const token = createHmac("sha256", unsubscribeSecret).update(recipient).digest("base64url");
          const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.twimzi.com").replace(/\/$/, "");
          personalizedBody += "\n\n---\nTo stop receiving Twimzi marketing emails, unsubscribe here: " + site + "/api/email/unsubscribe?email=" + encodeURIComponent(recipient) + "&token=" + token;
        }
        await sendViaHostinger(recipient, subject, personalizedBody, html);
        sent += 1;
        await supabase.from("email_campaign_recipients").update({ status: "accepted", accepted_at: new Date().toISOString(), provider_message: "Accepted by Hostinger SMTP" }).eq("campaign_id", campaign.id).eq("email", recipient);
      } catch (error) {
        // Log only safe diagnostic details; never log SMTP credentials or message bodies.
        console.error("[admin/send-email] SMTP send failed", {
          recipient,
          error: error instanceof Error ? error.message : "Unknown SMTP error",
        });
        failed.push(recipient);
        await supabase.from("email_campaign_recipients").update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "SMTP error" }).eq("campaign_id", campaign.id).eq("email", recipient);
      }
    }
    await supabase.from("email_campaigns").update({ status: failed.length ? (sent ? "partially_sent" : "failed") : "sent", accepted_count: sent, failed_count: failed.length + suppressedRecipients.length, completed_at: new Date().toISOString() }).eq("id", campaign.id);
    if (sent === 0) {
      return NextResponse.json({ error: "No emails were accepted by SMTP. Check Hostinger SMTP settings or recipient suppression.", campaignId: campaign.id, suppressed: suppressedRecipients.length }, { status: 502 });
    }
    const message = `${sent} of ${recipients.length} emails accepted by Hostinger SMTP for "${campaignName}". ${failed.length} failed; ${suppressedRecipients.length} unsubscribed/suppressed.`;
    return NextResponse.json({ ok: failed.length === 0, campaignId: campaign.id, sent, failed: failed.length, suppressed: suppressedRecipients.length, message }, { status: failed.length ? 207 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
