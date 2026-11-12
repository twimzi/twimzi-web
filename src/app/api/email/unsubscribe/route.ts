import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function tokenFor(email: string, secret: string) {
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("base64url");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const token = url.searchParams.get("token") || "";
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.EMAIL_AUTOMATION_CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", { status: 400 });
  }
  const expected = Buffer.from(tokenFor(email, secret));
  const supplied = Buffer.from(token);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
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
