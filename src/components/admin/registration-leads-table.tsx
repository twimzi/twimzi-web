"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type RegistrationLead = {
  session_id: string;
  payload: Record<string, string>;
  user_id: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  status: "new" | "contacted" | "follow_up" | "converted" | "not_interested";
  admin_notes: string | null;
  submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabels: Record<RegistrationLead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow-up",
  converted: "Converted",
  not_interested: "Not interested",
};

function localDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function whatsappNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function RegistrationLeadsTable({ initialLeads }: { initialLeads: RegistrationLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("open");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const visibleLeads = leads.filter((lead) => {
    if (filter === "open") return lead.status === "new" || lead.status === "follow_up";
    if (filter === "all") return true;
    return lead.status === filter;
  });

  async function saveLead(lead: RegistrationLead, status: RegistrationLead["status"], notes: string) {
    setSaving(lead.session_id);
    setMessage("");
    const { error } = await supabase.rpc("admin_update_registration_lead", {
      p_session_id: lead.session_id,
      p_status: status,
      p_admin_notes: notes,
    });
    if (error) {
      setMessage(error.message || "Unable to update this lead.");
    } else {
      setLeads((current) => current.map((item) =>
        item.session_id === lead.session_id
          ? { ...item, status, admin_notes: notes, updated_at: new Date().toISOString() }
          : item,
      ));
      setMessage("Lead updated.");
    }
    setSaving(null);
  }

  if (leads.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No consented registration leads yet. New leads will appear here as visitors enter details and agree to follow-up.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">{leads.length} captured leads · newest activity first</p>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm">
          <option value="open">Open leads</option>
          <option value="all">All leads</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="follow_up">Follow-up</option>
          <option value="converted">Converted</option>
          <option value="not_interested">Not interested</option>
        </select>
      </div>
      {message ? <p role="status" className="text-xs text-[var(--color-text-muted)]">{message}</p> : null}
      {visibleLeads.length === 0 ? <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No leads in this filter.</p> : (
        <div className="space-y-4">
          {visibleLeads.map((lead) => {
            const p = lead.payload ?? {};
            const phone = p.phone ?? "";
            const email = p.contact_email ?? "";
            const text = encodeURIComponent(`Hi ${p.contact_name || p.business_name || "there"}, you started creating your business profile on Twimzi. Need any help completing your registration?`);
            return (
              <LeadCard
                key={lead.session_id}
                lead={lead}
                phone={phone}
                email={email}
                text={text}
                saving={saving === lead.session_id}
                onSave={saveLead}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead, phone, email, text, saving, onSave,
}: {
  lead: RegistrationLead;
  phone: string;
  email: string;
  text: string;
  saving: boolean;
  onSave: (lead: RegistrationLead, status: RegistrationLead["status"], notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<RegistrationLead["status"]>(lead.status);
  const [notes, setNotes] = useState(lead.admin_notes ?? "");
  const p = lead.payload ?? {};
  const digits = whatsappNumber(phone);

  return (
    <article className="rounded-2xl border border-[var(--color-border)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--color-text)]">{p.business_name || "Business name not provided"}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{p.business_type || "Category not provided"} · {[p.city, p.state, p.country].filter(Boolean).join(", ") || "Location not provided"}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Started {localDate(lead.created_at)} · Last updated {localDate(lead.updated_at)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${lead.submitted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{lead.submitted ? "Submitted" : "Incomplete"}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-xs text-[var(--color-text-muted)]">Contact person</p><p className="text-sm font-medium">{p.contact_name || "Not provided"}</p></div>
        <div><p className="text-xs text-[var(--color-text-muted)]">Phone</p><p className="text-sm font-medium">{phone || "Not provided"}</p></div>
        <div><p className="text-xs text-[var(--color-text-muted)]">Email</p><p className="break-all text-sm font-medium">{email || "Not provided"}</p></div>
        <div><p className="text-xs text-[var(--color-text-muted)]">Address</p><p className="text-sm">{[p.address_line_1, p.address_line_2, p.landmark, p.postal_code].filter(Boolean).join(", ") || "Not provided"}</p></div>
        <div><p className="text-xs text-[var(--color-text-muted)]">Website</p>{p.website ? <a className="break-all text-sm text-[var(--color-primary)] underline" href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer">{p.website}</a> : <p className="text-sm">Not provided</p>}</div>
        <div><p className="text-xs text-[var(--color-text-muted)]">Campaign</p><p className="text-sm">{[lead.source, lead.medium, lead.campaign].filter(Boolean).join(" / ") || "Direct / unknown"}</p></div>
      </div>
      {p.description ? <div className="mt-3"><p className="text-xs text-[var(--color-text-muted)]">Business description</p><p className="whitespace-pre-wrap text-sm">{p.description}</p></div> : null}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--color-primary)]">View all entered details</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[var(--color-secondary)] p-3 text-xs">{JSON.stringify(p, null, 2)}</pre>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        {digits ? <a className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white" href={`https://wa.me/${digits}?text=${text}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        {phone ? <a className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold" href={`tel:${phone}`}>Call</a> : null}
        {email ? <a className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold" href={`mailto:${email}`}>Email</a> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
        <select value={status} onChange={(event) => setStatus(event.target.value as RegistrationLead["status"])} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm">
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder="Add follow-up notes..." className="min-h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm" />
        <button type="button" disabled={saving} onClick={() => void onSave(lead, status, notes)} className="min-h-10 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save lead"}</button>
      </div>
    </article>
  );
}
