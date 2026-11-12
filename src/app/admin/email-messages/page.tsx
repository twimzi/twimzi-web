"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, Copy, Eye, Mail, Send, Users, WandSparkles } from "lucide-react";

const templates = [
  { id: "invite", label: "Business invitation", category: "Acquisition", subject: "Get your business discovered on Twimzi", body: "Hello {{name}},\n\nWe’re introducing Twimzi — a platform to help local businesses grow their online presence.\n\nCreate your business profile, showcase your products and services, and help more customers discover you.\n\nRegister here: https://www.twimzi.com\n\nWe look forward to welcoming your business to Twimzi.\n\nRegards,\nTeam Twimzi" },
  { id: "products", label: "Add products", category: "Activation", subject: "Showcase your products on Twimzi", body: "Hello {{name}},\n\nHelp customers discover what your business offers by adding your products and services to your Twimzi profile.\n\nVisit https://www.twimzi.com to get started.\n\nRegards,\nTeam Twimzi" },
  { id: "profile", label: "Complete profile", category: "Activation", subject: "Complete your Twimzi business profile", body: "Hello {{name}},\n\nPlease complete your business profile on Twimzi by adding your business details, photos, products, and services. A complete profile helps customers understand your business.\n\nContinue at https://www.twimzi.com\n\nRegards,\nTeam Twimzi" },
  { id: "announcement", label: "Product announcement", category: "Announcement", subject: "An update from Twimzi", body: "Hello {{name}},\n\nWe have an update from Twimzi. Visit https://www.twimzi.com to explore local businesses, products, and services.\n\nThank you for being part of Twimzi.\n\nRegards,\nTeam Twimzi" },
];

type Tab = "compose" | "templates" | "automations" | "history";

export default function AdminEmailMessagesPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [campaignName, setCampaignName] = useState("Business invitation");
  const [templateId, setTemplateId] = useState("invite");
  const [recipientsText, setRecipientsText] = useState("");
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceMessage, setAudienceMessage] = useState("");

  const recipients = useMemo(() => Array.from(new Set(recipientsText.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))), [recipientsText]);
  const invalidRecipients = recipients.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const activeTemplate = templates.find((item) => item.id === templateId) ?? templates[0];

  useEffect(() => {
    if (tab !== "history") return;
    let active = true;
    setHistoryLoading(true);
    fetch("/api/admin/email-campaigns", { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; }).then((result) => { if (active) setCampaigns(result.campaigns || []); }).catch(() => { if (active) setCampaigns([]); }).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [tab]);

  function chooseTemplate(id: string) {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(id);
    setCampaignName(template.label);
    setSubject(template.subject);
    setBody(template.body);
    setStatus(null);
    setCopied(false);
  }

  async function sendCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipients.length || invalidRecipients.length || recipients.length > 25) return;
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, body, campaignName, consentConfirmed }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Campaign could not be sent.");
      setStatus({ kind: "success", text: result.message || "Campaign submitted." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Campaign could not be sent." });
    } finally {
      setSending(false);
    }
  }

  async function loadOptedInAudience() {
    setAudienceLoading(true);
    setAudienceMessage("");
    try {
      const response = await fetch("/api/admin/email-audience", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load opted-in users.");
      const emails = (result.recipients || []).map((item: { email: string }) => item.email);
      if (!emails.length) {
        setAudienceMessage("No registered users have a recorded marketing opt-in yet.");
      } else {
        setRecipientsText((current) => Array.from(new Set([...current.split(/[\s,;]+/), ...emails].map((value) => value.trim().toLowerCase()).filter(Boolean))).join("\n"));
        setAudienceMessage(String(emails.length) + " opted-in registered user(s) added.");
      }
    } catch (error) {
      setAudienceMessage(error instanceof Error ? error.message : "Could not load opted-in users.");
    } finally {
      setAudienceLoading(false);
    }
  }

  async function copyCampaign() {
    try {
      await navigator.clipboard.writeText(`Campaign: ${campaignName}\nSubject: ${subject}\nRecipients:\n${recipients.join("\n")}\n\n${body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const navItems: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: "compose", label: "Campaign builder", icon: Mail },
    { id: "templates", label: "Templates", icon: WandSparkles },
    { id: "automations", label: "Automations", icon: Clock3 },
    { id: "history", label: "Campaign history", icon: Eye },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">Twimzi growth suite</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Email Marketing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Build targeted email campaigns with your Hostinger business mailbox. Compose, personalize, preview, and send to a small recipient batch.</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs text-[var(--color-text-muted)]">Sending provider</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-amber-500" /> Hostinger SMTP · server connection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Recipients in draft", value: String(recipients.length), icon: Users },
          { label: "Templates", value: String(templates.length), icon: WandSparkles },
          { label: "Automations", value: "Not configured", icon: Clock3 },
          { label: "Sent campaigns", value: "—", icon: Send },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]"><span>{item.label}</span><item.icon size={16} /></div>
            <p className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === item.id ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-secondary)] hover:bg-gray-100"}`}><Icon size={16} />{item.label}</button>;
        })}
      </div>

      {tab === "compose" && (
        <form onSubmit={sendCampaign} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-[var(--color-primary-light)] p-3 text-[var(--color-primary)]"><Mail size={20} /></div><div><h2 className="font-bold">Create campaign</h2><p className="text-sm text-[var(--color-text-muted)]">Draft and send an email campaign</p></div></div>
            <div>
              <label htmlFor="campaign-name" className="mb-2 block text-sm font-semibold">Campaign name</label>
              <input id="campaign-name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} required maxLength={120} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <label htmlFor="campaign-template" className="mb-2 block text-sm font-semibold">Start from a template</label>
              <select id="campaign-template" value={templateId} onChange={(e) => chooseTemplate(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">{templates.map((t) => <option key={t.id} value={t.id}>{t.label} · {t.category}</option>)}</select>
            </div>
            <div>
              <label htmlFor="recipients" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users size={16} /> Recipients</label>
              <textarea id="recipients" value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} required rows={4} placeholder={"business@example.com\ncontact@example.com"} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
              <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--color-text-muted)]"><span>{recipients.length} unique recipient(s) · maximum 25 per send</span><span>Separate with commas or new lines</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={loadOptedInAudience} disabled={audienceLoading} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">{audienceLoading ? "Loading opted-in users…" : "Add opted-in registered users"}</button>
                {audienceMessage && <span className="text-xs text-[var(--color-text-secondary)]">{audienceMessage}</span>}
              </div>
              {invalidRecipients.length > 0 && <p className="mt-2 text-xs text-red-600">Invalid email(s): {invalidRecipients.slice(0, 3).join(", ")}</p>}
              {recipients.length > 25 && <p className="mt-2 text-xs text-red-600">This batch exceeds 25 recipients. Split it into smaller batches.</p>}
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
              <span>I confirm every recipient agreed to receive Twimzi marketing emails. This is not a purchased or unsolicited list. Unsubscribed addresses are suppressed.</span>
            </label>
            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-semibold">Email subject</label>
              <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><label htmlFor="body" className="block text-sm font-semibold">Message content</label><span className="text-xs text-[var(--color-text-muted)]">Personalization: {"{{name}}"}</span></div>
              <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={20000} rows={13} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]" />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{body.length.toLocaleString()} / 20,000 characters</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setPreview(!preview)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold hover:bg-gray-50"><Eye size={16} />{preview ? "Hide preview" : "Preview email"}</button>
              <button type="button" onClick={copyCampaign} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold hover:bg-gray-50"><Copy size={16} />{copied ? "Copied" : "Copy campaign"}</button>
              <button type="submit" disabled={sending || !consentConfirmed || !recipients.length || invalidRecipients.length > 0 || recipients.length > 25 || !subject.trim() || !body.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{sending ? "Sending…" : <><Send size={17} /> Send campaign <ChevronRight size={16} /></>}</button>
            </div>
            {preview && <div className="rounded-xl border border-[var(--color-border)] bg-gray-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Email preview · plain text</p><p className="mt-3 text-sm"><strong>Subject:</strong> {subject}</p><div className="my-3 border-t border-[var(--color-border)]" /><p className="whitespace-pre-wrap text-sm leading-6">{body.replaceAll("{{name}}", "there")}</p></div>}
            {status && <div role="status" className={`flex items-start gap-2 rounded-xl p-4 text-sm ${status.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{status.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}<span>{status.text}</span></div>}
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <h3 className="font-bold">Campaign checklist</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  ["Recipients added", recipients.length > 0 && invalidRecipients.length === 0 && recipients.length <= 25],
                  ["Subject added", !!subject.trim()],
                  ["Message ready", !!body.trim()],
                  ["Batch size within limit", recipients.length <= 25],
                ].map(([label, done]) => <li key={String(label)} className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>{done ? "✓" : "·"}</span><span className={done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>{label}</span></li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <h3 className="font-bold">Sender configuration</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Uses Hostinger SMTP credentials stored on the server. No email password is exposed to the browser.</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-500" /> SMTP credentials are read from Hostinger server environment</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              <strong className="block">Responsible sending</strong>
              Send only to contacts who opted in to marketing emails. Every marketing send includes an unsubscribe link, and unsubscribed addresses are blocked. SMTP acceptance is not proof of inbox delivery.
            </div>
          </aside>
        </form>
      )}

      {tab === "templates" && <div className="grid gap-4 md:grid-cols-2">{templates.map((t) => <div key={t.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">{t.category}</span><h3 className="mt-3 font-bold">{t.label}</h3><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t.subject}</p></div><WandSparkles size={19} className="text-[var(--color-primary)]" /></div><p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">{t.body}</p><button type="button" onClick={() => { chooseTemplate(t.id); setTab("compose"); }} className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:bg-gray-50">Use template</button></div>)}</div>}

      {tab === "automations" && <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)]"><Clock3 size={22} /></div><h2 className="mt-4 text-xl font-bold">Email automations</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Business registration events now enqueue transactional emails automatically. A scheduled Hostinger cron request must process the queue.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["Welcome new businesses", "Queued shortly after a business is created", "Event-triggered"], ["Profile completion reminder", "Queued 3 days after business creation; cancelled if profile is complete", "Scheduled"], ["Marketing unsubscribe", "Signed unsubscribe links are appended to marketing emails", "Enabled"], ["Campaign audit trail", "Campaign and per-recipient SMTP outcomes are stored", "Enabled"]].map(([name, trigger, state]) => <div key={name} className="rounded-xl border border-[var(--color-border)] p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{name}</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{state}</span></div><p className="mt-1 text-sm text-[var(--color-text-muted)]">{trigger}</p></div>)}</div><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Scheduler required:</strong> configure Hostinger Cron Jobs to POST to <code>/api/cron/email-automation</code> every 5 minutes with header <code>Authorization: Bearer YOUR_EMAIL_AUTOMATION_CRON_SECRET</code>. Keep the secret private.</div></div>}

      {tab === "history" && <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"><div className="border-b border-[var(--color-border)] p-5"><h2 className="font-bold">Campaign history</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">SMTP acceptance and failures; not inbox delivery confirmation.</p></div>{historyLoading ? <p className="p-8 text-center text-sm">Loading campaigns…</p> : campaigns.length === 0 ? <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">No campaign records yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase"><tr><th className="p-4">Campaign</th><th className="p-4">Status</th><th className="p-4">Recipients</th><th className="p-4">Accepted</th><th className="p-4">Failed</th><th className="p-4">Created</th></tr></thead><tbody>{campaigns.map((item) => <tr key={item.id} className="border-t"><td className="p-4"><strong>{item.name}</strong><p className="text-xs text-gray-500">{item.subject}</p></td><td className="p-4 capitalize">{String(item.status).replaceAll("_", " ")}</td><td className="p-4">{item.total_recipients}</td><td className="p-4">{item.accepted_count}</td><td className="p-4">{item.failed_count}</td><td className="p-4">{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</div>}
    </div>
  );
}
