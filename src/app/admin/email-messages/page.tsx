"use client";

import { useState } from "react";
import { Copy, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

const templates = [
  { name: "Invite a business", subject: "Get your business discovered on Twimzi", body: "Hello,\n\nWe’re introducing Twimzi — a platform to help local businesses grow their online presence.\n\nCreate your business profile, showcase your products and services, and help more customers discover you.\n\nRegister here: https://www.twimzi.com\n\nWe look forward to welcoming your business to Twimzi.\n\nRegards,\nTeam Twimzi" },
  { name: "Add products", subject: "Showcase your products on Twimzi", body: "Hello,\n\nHelp customers discover what your business offers by adding your products and services to your Twimzi profile.\n\nVisit https://www.twimzi.com to get started.\n\nRegards,\nTeam Twimzi" },
  { name: "Complete your profile", subject: "Complete your Twimzi business profile", body: "Hello,\n\nPlease complete your business profile on Twimzi by adding your business details, photos, products, and services. A complete profile helps customers understand your business.\n\nContinue at https://www.twimzi.com\n\nRegards,\nTeam Twimzi" },
  { name: "General announcement", subject: "An update from Twimzi", body: "Hello,\n\nWe have an update from Twimzi. Visit https://www.twimzi.com to explore local businesses, products, and services.\n\nThank you for being part of Twimzi.\n\nRegards,\nTeam Twimzi" },
];

export default function AdminEmailMessagesPage() {
  const [recipient, setRecipient] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].name);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function chooseTemplate(name: string) {
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    setSelectedTemplate(name);
    setSubject(template.subject);
    setBody(template.body);
    setStatus(null);
    setCopied(false);
  }

  async function sendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient.trim(), subject, body }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Email could not be sent.");
      setStatus({ kind: "success", text: result.message || "Email sent successfully." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Email could not be sent." });
    } finally {
      setSending(false);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">Growth tools</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">Email Messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Send an email directly from Super Admin using your configured Hostinger business email. Choose a template or write your own message.
        </p>
      </div>

      <form onSubmit={sendEmail} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="email-template" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Email template</label>
        <select id="email-template" value={selectedTemplate} onChange={(event) => chooseTemplate(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">
          {templates.map((template) => <option key={template.name} value={template.name}>{template.name}</option>)}
        </select>

        <label htmlFor="recipient" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Recipient email</label>
        <input id="recipient" type="email" autoComplete="email" required maxLength={254} value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="business@example.com" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />

        <label htmlFor="subject" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Subject</label>
        <input id="subject" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />

        <label htmlFor="body" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Email message</label>
        <textarea id="body" required maxLength={20000} value={body} onChange={(event) => { setBody(event.target.value); setCopied(false); }} rows={11} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]" />

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{body.length} characters</span>
          <button type="button" onClick={copyEmail} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-[var(--color-primary-light)]"><Copy size={15} /> {copied ? "Copied" : "Copy email"}</button>
        </div>

        {status && (
          <div role="status" className={`mt-5 flex items-start gap-2 rounded-xl p-4 text-sm ${status.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {status.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
            <span>{status.text}</span>
          </div>
        )}

        <button type="submit" disabled={sending || !recipient.trim() || !subject.trim() || !body.trim()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
          {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending email…</> : <><Send size={18} /> Send Email</>}
        </button>
      </form>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        SMTP credentials must be configured as private Hostinger environment variables before sending works. Send only to recipients who expect or have agreed to receive your messages.
      </div>
    </div>
  );
}
