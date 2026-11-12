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



async function sendViaHostinger(to: string, subject: string, body: string) {
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
    const message = [
      "From: " + encodeHeader(from),
      "To: " + encodeHeader(to),
      "Subject: " + encodeSubject(subject),
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(body, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n").trimEnd(),
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
    const campaignName = typeof payload.campaignName === "string" ? payload.campaignName.trim().slice(0, 120) : "Email campaign";
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
      return NextResponse.json({ error: "Enter a subject of up to 200 characters." }, { status: 400 });
    }
    if (!body || body.length > 20000) {
      return NextResponse.json({ error: "Enter a message up to 20,000 characters." }, { status: 400 });
    }

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
    const preferenceByEmail = new Map((preferences ?? []).map((row) => [String(row.email).toLowerCase(), row]));
    const eligibleRecipients = recipients.filter((email) => {
      const preference = preferenceByEmail.get(email);
      return campaignType === "transactional" || (!preference?.unsubscribed_at && (preference?.marketing_consent === true || payload.consentConfirmed === true));
    });
    const suppressedRecipients = recipients.filter((email) => !eligibleRecipients.includes(email));
    if (campaignType === "marketing" && payload.consentConfirmed === true && eligibleRecipients.length) {
      await supabase.from("email_preferences").upsert(
        eligibleRecipients.map((email) => ({ email, marketing_consent: true, consent_source: "admin_campaign_confirmation", consent_at: new Date().toISOString(), updated_at: new Date().toISOString() })),
        { onConflict: "email", ignoreDuplicates: false }
      );
    }
    if (suppressedRecipients.length) {
      await supabase.from("email_campaign_recipients").insert(suppressedRecipients.map((email) => ({
        campaign_id: campaign.id, email, status: "suppressed", error_message: "Recipient has unsubscribed."
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
          personalizedBody += \`\n\n---\nTo stop receiving Twimzi marketing emails, unsubscribe here: \${site}/api/email/unsubscribe?email=\${encodeURIComponent(recipient)}&token=\${token}\`;
        }
        await sendViaHostinger(recipient, subject, personalizedBody);
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
