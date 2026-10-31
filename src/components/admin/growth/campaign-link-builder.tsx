"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/config/site";

export function CampaignLinkBuilder() {
  const [source, setSource] = useState("whatsapp");
  const [medium, setMedium] = useState("message");
  const [campaign, setCampaign] = useState("ludhiana_business_outreach");
  const [copied, setCopied] = useState(false);

  const campaignUrl = useMemo(() => {
    const params = new URLSearchParams({
      utm_source: source.trim() || "whatsapp",
      utm_medium: medium.trim() || "message",
      utm_campaign: campaign.trim() || "business_outreach",
    });

    return \`\${siteConfig.url}/add-business?\${params.toString()}\`;
  }, [campaign, medium, source]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
          Source
          <input
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setCopied(false);
            }}
            placeholder="whatsapp"
            maxLength={100}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
          Medium
          <input
            value={medium}
            onChange={(event) => {
              setMedium(event.target.value);
              setCopied(false);
            }}
            placeholder="message"
            maxLength={100}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
          Campaign name
          <input
            value={campaign}
            onChange={(event) => {
              setCampaign(event.target.value);
              setCopied(false);
            }}
            placeholder="ludhiana_business_outreach"
            maxLength={120}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] px-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]"
          />
        </label>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
        <p className="break-all text-xs leading-5 text-[var(--color-text-secondary)]">{campaignUrl}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          {copied ? "Copied campaign link" : "Copy campaign link"}
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Use a different campaign name for each WhatsApp list or outreach batch.
        </p>
      </div>
    </div>
  );
}
