"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Copy, Share2 } from "lucide-react";

export type SavedNewsItem = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  url: string;
};

const STORAGE_KEY = "twimzi:saved-news:v1";

function readSaved(): SavedNewsItem[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function NewsActions({ item, compact = false }: { item: SavedNewsItem; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(readSaved().some((entry) => entry.slug === item.slug));
  }, [item.slug]);

  function toggleSaved() {
    const current = readSaved();
    const exists = current.some((entry) => entry.slug === item.slug);
    const next = exists ? current.filter((entry) => entry.slug !== item.slug) : [item, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(!exists);
    window.dispatchEvent(new Event("twimzi:saved-news-changed"));
  }

  async function share() {
    const shareData = { title: item.title, text: item.summary, url: item.url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* User cancelled the share sheet. */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this news link", new URL(item.url, window.location.origin).toString());
    }
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      <button type="button" onClick={toggleSaved} aria-pressed={saved} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${saved ? "border-violet-200 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700"}`}>
        {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {compact ? (saved ? "Saved" : "Save") : (saved ? "Saved to reading list" : "Save for later")}
      </button>
      <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
        {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}

export function SavedNewsList() {
  const [items, setItems] = useState<SavedNewsItem[]>([]);
  useEffect(() => {
    const refresh = () => setItems(readSaved());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("twimzi:saved-news-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("twimzi:saved-news-changed", refresh);
    };
  }, []);

  if (!items.length) {
    return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Bookmark className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-extrabold text-[#14243D]">Your reading list is empty</h2><p className="mt-2 text-sm text-slate-500">Save useful business updates and they will appear here on this device.</p><a href="/news" className="mt-6 inline-flex rounded-xl bg-[#14243D] px-5 py-3 text-sm font-bold text-white">Explore business news</a></div>;
  }

  return <div className="grid gap-4 md:grid-cols-2">{items.map((item) => (
    <article key={item.slug} className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold text-violet-700">{item.category} · {new Date(item.publishedAt).toLocaleDateString("en-IN")}</p>
      <h2 className="mt-3 text-lg font-extrabold leading-snug text-[#14243D]"><a href={item.url} className="hover:text-blue-700">{item.title}</a></h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p>
      <div className="mt-4 flex justify-end"><NewsActions item={item} compact /></div>
    </article>
  ))}</div>;
}
