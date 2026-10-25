"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Copy, ExternalLink } from "lucide-react";

const templates = [
  {
    name: "Invite a business",
    message: "Hi! 👋\n\nWe’re introducing Twimzi — a platform to help local businesses grow their online presence.\n\nCreate your business profile, showcase your products and services, and help more customers discover you.\n\nRegister here: https://www.twimzi.com\n\nJoin Twimzi and help your business get discovered! 🚀",
  },
  {
    name: "Add products",
    message: "Hi! 👋\n\nYour business can get more visibility on Twimzi. Add your products and services so customers can discover what you offer.\n\nVisit https://www.twimzi.com and complete your business profile.\n\nTeam Twimzi",
  },
  {
    name: "Complete your profile",
    message: "Hi! 👋\n\nPlease complete your business profile on Twimzi by adding your business details, photos, products, and services. A complete profile helps customers understand your business.\n\nContinue here: https://www.twimzi.com\n\nTeam Twimzi",
  },
  {
    name: "General announcement",
    message: "Hello! 👋\n\nWe have an update from Twimzi. Visit https://www.twimzi.com to explore local businesses, products, and services.\n\nThank you for being part of Twimzi!",
  },
];

export default function AdminWhatsAppMessagesPage() {
  const [phone, setPhone] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].name);
  const [message, setMessage] = useState(templates[0].message);
  const [copied, setCopied] = useState(false);

  const normalizedPhone = useMemo(() => phone.replace(/[^0-9]/g, ""), [phone]);
  const whatsappUrl = useMemo(() => {
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15 || !message.trim()) return "";
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }, [normalizedPhone, message]);

  function chooseTemplate(name: string) {
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    setSelectedTemplate(name);
    setMessage(template.message);
    setCopied(false);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary)]">Growth tools</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">WhatsApp Messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Choose a ready-made message, enter a recipient’s number, and open WhatsApp Business with the message pre-filled. You review and send it yourself.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="template" className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">Message template</label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={(event) => chooseTemplate(event.target.value)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
        >
          {templates.map((template) => <option key={template.name} value={template.name}>{template.name}</option>)}
        </select>

        <label htmlFor="phone" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Recipient mobile number</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="e.g. 919876543210"
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">Include the country code, e.g. 91 for India. Spaces and + are removed automatically.</p>

        <label htmlFor="message" className="mb-2 mt-5 block text-sm font-semibold text-[var(--color-text-primary)]">Edit message</label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => { setMessage(event.target.value); setCopied(false); }}
          rows={9}
          className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <span>{message.length} characters</span>
          <button type="button" onClick={copyMessage} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-[var(--color-primary-light)]">
            <Copy size={15} /> {copied ? "Copied" : "Copy message"}
          </button>
        </div>

        <a
          href={whatsappUrl || undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsappUrl}
          onClick={(event) => { if (!whatsappUrl) event.preventDefault(); }}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition sm:w-auto ${whatsappUrl ? "bg-[#128C7E] hover:bg-[#0e776b]" : "cursor-not-allowed bg-gray-400"}`}
        >
          <MessageCircle size={18} /> Open in WhatsApp Business <ExternalLink size={15} />
        </a>
        {!whatsappUrl && <p className="mt-2 text-xs text-amber-700">Enter a valid number with country code to enable the button.</p>}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        WhatsApp opens with the message ready; it does not send automatically. Contact people who have agreed to receive messages, and respect opt-outs.
      </div>
    </div>
  );
}
