import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { SavedNewsList } from "@/components/news/news-actions";

export const metadata: Metadata = {
  title: "Saved Business News | Twimzi",
  description: "Your saved business news and insights on trade, exports, manufacturing and policy.",
  robots: { index: false, follow: true },
};

export default function SavedNewsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FD]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" /> Business News</Link>
        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Bookmark className="h-6 w-6" /></span>
          <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-violet-700">Your personal collection</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#14243D]">Saved business news</h1></div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Keep important policy updates, export insights and industry developments close at hand. Your reading list is stored locally in this browser.</p>
        <div className="mt-8"><SavedNewsList /></div>
      </div>
    </main>
  );
}
