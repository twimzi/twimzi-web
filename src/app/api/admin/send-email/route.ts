import tls from "node:tls";
import { createInterface } from "node:readline";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function encodeBody(value: string) {
  return value.replace(/\r?\n/g, "\r\n").split("\r\n").map((line) => line.startsWith(".") ? "." + line : line).join("\r\n");
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
    connection.write("QUIT\r\n");
    await expect(connection, ["221"]);
  } finally {
    connection.close();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    const { data: isSuperAdmin, error: roleError } = await supabase.rpc("is_super_admin");
    if (roleError || isSuperAdmin !== true) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

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

    let sent = 0;
    const failed: string[] = [];
    for (const recipient of recipients) {
      try {
        const personalizedBody = body.replace(/\{\{name\}\}/g, "there");
        await sendViaHostinger(recipient, subject, personalizedBody);
        sent += 1;
      } catch (error) {
        // Log only safe diagnostic details; never log SMTP credentials or message bodies.
        console.error("[admin/send-email] SMTP send failed", {
          recipient,
          error: error instanceof Error ? error.message : "Unknown SMTP error",
        });
        failed.push(recipient);
      }
    }
    if (sent === 0) {
      return NextResponse.json({ error: "No emails were sent. Check the Hostinger SMTP settings and server logs." }, { status: 502 });
    }
    const message = failed.length
      ? `${sent} of ${recipients.length} emails sent for "${campaignName}". Failed recipients: ${failed.join(", ")}.`
      : `Campaign "${campaignName}" sent to ${sent} recipient(s).`;
    return NextResponse.json({ ok: failed.length === 0, sent, failed: failed.length, message }, { status: failed.length ? 207 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
