import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function tokenFor(email: string, secret: string) {
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("base64url");
}

function validToken(email: string, token: string, secret: string) {
  const expected = Buffer.from(tokenFor(email, secret));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.EMAIL_AUTOMATION_CRON_SECRET;
  if (!secret || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validToken(email, token, secret)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", { status: 400 });
  }
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe from Twimzi</title></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:12vh auto;padding:24px;color:#202124"><h1>Unsubscribe from Twimzi marketing emails</h1><p>Confirm that you no longer want to receive promotional emails from Twimzi at <strong>${email.replace(/[&<>"]/g, "")}</strong>.</p><form method="post" action="/api/email/unsubscribe"><input type="hidden" name="email" value="${email}"><input type="hidden" name="token" value="${token}"><button style="background:#1f5eff;color:white;border:0;border-radius:8px;padding:12px 20px;font-weight:700;cursor:pointer">Confirm unsubscribe</button></form></body></html>`, {
    status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const token = String(form.get("token") || "");
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.EMAIL_AUTOMATION_CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validToken(email, token, secret)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", { status: 400 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.from("email_preferences").upsert({
    email, marketing_consent: false, unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString(), consent_source: "email_unsubscribe"
  }, { onConflict: "email" });
  if (error) return new NextResponse("We could not process your request. Please contact support.", { status: 500 });
  return new NextResponse("You have been unsubscribed from Twimzi marketing emails. You may still receive essential account and service messages.", {
    status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
