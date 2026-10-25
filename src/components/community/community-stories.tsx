"use client";

import { useState } from "react";
import Link from "next/link";

export type CommunityStory = {
  id: string;
  caption: string | null;
  imageUrl: string;
  businessName: string;
  businessUrl: string;
  createdAt: string;
};

type Props = {
  stories: CommunityStory[];
};

export default function CommunityStories({ stories }: Props) {
  const [activeStory, setActiveStory] = useState<CommunityStory | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      <section aria-labelledby="community-stories-heading" className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Fresh from local businesses</p>
            <h2 id="community-stories-heading" className="mt-1 text-xl font-bold text-slate-950">Stories</h2>
          </div>
          <span className="text-xs text-slate-500">Available for a limited time</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stories.map((story) => (
            <button key={story.id} type="button" onClick={() => setActiveStory(story)} className="group flex w-[88px] shrink-0 flex-col items-center gap-2 text-center" aria-label={`View story from ${story.businessName}`}>
              <span className="rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-teal-500 p-[3px] transition group-hover:scale-105">
                <span className="block rounded-full bg-white p-[3px]">
                  <span className="block h-[66px] w-[66px] overflow-hidden rounded-full bg-slate-100">
                    <img src={story.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                </span>
              </span>
              <span className="w-full truncate text-xs font-medium text-slate-700">{story.businessName}</span>
            </button>
          ))}
        </div>
      </section>

      {activeStory && (
        <div role="dialog" aria-modal="true" aria-label={`Story from ${activeStory.businessName}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4" onClick={() => setActiveStory(null)}>
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{activeStory.businessName}</p>
                <p className="text-xs text-white/70">{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(activeStory.createdAt))}</p>
              </div>
              <button type="button" onClick={() => setActiveStory(null)} className="rounded-full bg-white/15 px-3 py-1 text-xl text-white hover:bg-white/25" aria-label="Close story">×</button>
            </div>
            <img src={activeStory.imageUrl} alt={activeStory.caption || `Story from ${activeStory.businessName}`} className="max-h-[75vh] w-full object-contain" />
            {activeStory.caption && <p className="whitespace-pre-line px-5 py-4 text-sm leading-6 text-white">{activeStory.caption}</p>}
            <div className="p-4 pt-0">
              <Link href={activeStory.businessUrl} onClick={() => setActiveStory(null)} className="inline-flex rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">View business</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
