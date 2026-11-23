"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
};

const STORAGE_KEY = "twimzi:cookie-consent:v1";
const CONSENT_EVENT = "twimzi:cookie-consent-changed";

function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Consent>;
    if (value.version !== 1 || typeof value.analytics !== "boolean" || typeof value.marketing !== "boolean") return null;
    return { necessary: true, analytics: value.analytics, marketing: value.marketing, updatedAt: value.updatedAt ?? "", version: 1 };
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const consent: Consent = { necessary: true, analytics, marketing, updatedAt: new Date().toISOString(), version: 1 };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const current = readConsent();
    setConsent(current);
    setAnalytics(current?.analytics ?? false);
    setMarketing(current?.marketing ?? false);
  }, []);

  function choose(allowAnalytics: boolean, allowMarketing: boolean) {
    const next = saveConsent(allowAnalytics, allowMarketing);
    setConsent(next);
    setAnalytics(next.analytics);
    setMarketing(next.marketing);
    setSettingsOpen(false);
  }

  if (consent && !settingsOpen) {
    return (
      <button type="button" onClick={() => setSettingsOpen(true)} className="fixed bottom-4 left-4 z-[90] rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:border-[#0D9488]">
        Cookie preferences
      </button>
    );
  }

  return (
    <section aria-label="Cookie preferences" aria-live="polite" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:inset-x-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-base font-bold text-slate-900">Your privacy choices</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Twimzi uses necessary technologies to run the service. With your permission, we also use analytics to understand usage and marketing technologies if enabled in future. You can change your choice at any time.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Read our <Link href="/cookie-policy" className="font-semibold text-[#0D9488] underline">Cookie Policy</Link> and <Link href="/privacy-policy" className="font-semibold text-[#0D9488] underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => choose(false, false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reject optional</button>
          <button type="button" onClick={() => setSettingsOpen((open) => !open)} className="rounded-xl border border-[#0D9488] px-4 py-2.5 text-sm font-semibold text-[#0D9488] hover:bg-teal-50">Settings</button>
          <button type="button" onClick={() => choose(true, true)} className="rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Accept all</button>
        </div>
      </div>
      {settingsOpen && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <div><p className="text-sm font-semibold text-slate-900">Necessary</p><p className="text-xs text-slate-500">Required for security, authentication and core functionality.</p></div>
            <span className="text-xs font-semibold text-slate-500">Always active</span>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-slate-100 py-3">
            <span><span className="block text-sm font-semibold text-slate-900">Analytics</span><span className="block text-xs text-slate-500">Helps us understand visits and improve Twimzi.</span></span>
            <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5 accent-[#0D9488]" />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-slate-100 py-3">
            <span><span className="block text-sm font-semibold text-slate-900">Marketing</span><span className="block text-xs text-slate-500">Allows marketing-related storage or measurement if introduced.</span></span>
            <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="h-5 w-5 accent-[#0D9488]" />
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => choose(false, false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reject optional</button>
            <button type="button" onClick={() => choose(analytics, marketing)} className="rounded-xl bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white">Save preferences</button>
          </div>
        </div>
      )}
    </section>
  );
}
