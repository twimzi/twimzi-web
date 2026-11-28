import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderEmailTemplate } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.EMAIL_AUTOMATION_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Automation service is not configured." }, { status: 503 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } });
  const { data: jobs, error } = await supabase
    .from("email_automation_queue")
    .select("id,event_key,email,display_name,template_key,payload,attempts")
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(10);
  if (error) return NextResponse.json({ error: "Could not load automation queue." }, { status: 500 });

  let accepted = 0;
  let failed = 0;
  let skipped = 0;
  for (const job of jobs ?? []) {
    const { data: claimed } = await supabase
      .from("email_automation_queue")
      .update({ status: "sending", attempts: Number(job.attempts || 0) + 1 })
      .eq("id", job.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    if (job.template_key === "profile_reminder" && job.payload?.business_id) {
      const { data: business } = await supabase.from("businesses").select("profile_completion,deleted_at").eq("id", job.payload.business_id).maybeSingle();
      if (!business || business.deleted_at || Number(business.profile_completion ?? 0) >= 100) {
        await supabase.from("email_automation_queue").update({ status: "cancelled", last_error: "Profile already complete or business unavailable." }).eq("id", job.id);
        skipped += 1;
        continue;
      }
    }

    let email: ReturnType<typeof renderEmailTemplate>;
    try {
      email = renderEmailTemplate(job.template_key, job.display_name || "there", (job.payload || {}) as Record<string, unknown>);
    } catch {
      await supabase.from("email_automation_queue").update({ status: "failed", last_error: "Unknown automation template." }).eq("id", job.id);
      failed += 1;
      continue;
    }
    try {
      const response = await fetch(new URL("/api/admin/send-email", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${secret}` },
        body: JSON.stringify({ recipients: [job.email], subject: email.subject, body: email.body, html: email.html, campaignName: job.template_key, campaignType: "transactional" }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "SMTP send failed.");
      await supabase.from("email_automation_queue").update({ status: "accepted", accepted_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      accepted += 1;
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message.slice(0, 500) : "Email send failed.";
      await supabase.from("email_automation_queue").update({ status: Number(job.attempts || 0) < 2 ? "queued" : "failed", scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), last_error: message }).eq("id", job.id);
      failed += 1;
    }
  }
  return NextResponse.json({ ok: true, checked: jobs?.length ?? 0, accepted, failed, skipped });
}
