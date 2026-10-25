"use client";

import { useMemo, useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";

const templates = [
  {
    name: "Invite a business",
    subject: "Get your business discovered on Twimzi",
    body: "Hello,\n\nWe’re introducing Twimzi — a platform to help local businesses grow their online presence.\n\nCreate your business profile, showcase your products and services, and help more customers discover you.\n\nRegister here: https://www.twimzi.com\n\nWe look forward to welcoming your business to Twimzi.\n\nRegards,\nTeam Twimzi",
  },
  {
    name: "Add products",
    subject: "Showcase your products on Twimzi",
    body: "Hello,\n\nHelp customers discover what your business offers by adding your products and services to your Twimzi profile.\n\nVisit https://www.twimzi.com to get started.\n\nRegards,\nTeam Twimzi",
  },
  {
    name: "Complete your profile",
    subject: "Complete your Twimzi business profile",
    body: "Hello,\n\nPlease complete your business profile on Twimzi by adding your business details, photos, products, and services. A complete profile helps customers understand your business.\n\nContinue at https://www.twimzi.com\n\nRegards,\nTeam Twimzi",
  },
  {
    name: "General announcement",
    subject: "An update from Twimzi",
    body: "Hello,\n\nWe have an update from Twimzi. Visit https://www.twimzi.com to explore local businesses, products, and services.\n\nThank you for being part of Twimzi.\n\nRegards,\nTeam Twimzi",
  },
];

export default function AdminEmailMessagesPage() {
  const [recipient, setRecipient] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].name);
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [copied, setCopied] = useState(false);

  const emailUrl = useMemo(() => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim()) || !subject.trim() || !body.trim()) return "";
    return `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [recipient, subject, body]);

  function chooseTemplate(name: string) {
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    setSelectedTemplate(name);
    setSubject(template.subject);
    setBody(template.body);
    setCopied(false);
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
          Select a template, enter the recipient, edit the subject or message, and open your email app with everything pre-filled.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="email-template" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Email template</label>
        <select id="email-template" value={selectedTemplate} onChange={(event) => chooseTemplate(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]">
          {templates.map((template) => <option key={template.name} value={template.name}>{template.name}</option>)}
        </select>

        <label htmlFor="recipient" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Recipient email</label>
        <input id="recipient" type="email" autoComplete="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="business@example.com" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />

        <label htmlFor="subject" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Subject</label>
        <input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]" />

        <label htmlFor="body" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Email message</label>
        <textarea id="body" value={body} onChange={(event) => { setBody(event.target.value); setCopied(false); }} rows={11} className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]" />

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{body.length} characters</span>
          <button type="button" onClick={copyEmail} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-[var(--color-primary-light)]"><Copy size={15} /> {copied ? "Copied" : "Copy email"}</button>
        </div>

        <a href={emailUrl || undefined} aria-disabled={!emailUrl} onClick={(event) => { if (!emailUrl) event.preventDefault(); }} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition sm:w-auto ${emailUrl ? "bg-[var(--color-primary)] hover:opacity-90" : "cursor-not-allowed bg-gray-400"}`}>
          <Mail size={18} /> Open in Email App <ExternalLink size={15} />
        </a>
        {!emailUrl && <p className="mt-2 text-xs text-amber-700">Enter a valid recipient email, subject, and message to enable the button.</p>}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        This opens your device’s configured email app; it does not send automatically. It is for one recipient at a time and does not yet send campaigns or automated emails from Twimzi itself.
      </div>
    </div>
  );
}
