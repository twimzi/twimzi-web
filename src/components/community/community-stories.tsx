"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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

type BusinessStoryGroup = {
  key: string;
  businessName: string;
  businessUrl: string;
  stories: CommunityStory[];
};

function formatStoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function CommunityStories({ stories }: Props) {
  const [activeGroup, setActiveGroup] = useState<BusinessStoryGroup | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = stories.reduce<BusinessStoryGroup[]>((result, story) => {
    const key = story.businessUrl || story.businessName;
    const existing = result.find((group) => group.key === key);
    if (existing) {
      existing.stories.push(story);
    } else {
      result.push({
        key,
        businessName: story.businessName,
        businessUrl: story.businessUrl,
        stories: [story],
      });
    }
    return result;
  }, []);

  const activeStory = activeGroup?.stories[activeIndex] ?? null;

  useEffect(() => {
    if (!activeGroup) return;
    const storyCount = activeGroup.stories.length;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveGroup(null);
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => Math.min(index + 1, storyCount - 1));
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGroup]);

  if (groups.length === 0) return null;

  function openGroup(group: BusinessStoryGroup) {
    setActiveGroup(group);
    setActiveIndex(0);
  }

  function goNext() {
    if (!activeGroup) return;
    if (activeIndex < activeGroup.stories.length - 1) {
      setActiveIndex((index) => index + 1);
    } else {
      const currentGroupIndex = groups.findIndex((group) => group.key === activeGroup.key);
      const nextGroup = groups[currentGroupIndex + 1];
      if (nextGroup) openGroup(nextGroup);
      else setActiveGroup(null);
    }
  }

  function goPrevious() {
    if (!activeGroup) return;
    if (activeIndex > 0) {
      setActiveIndex((index) => index - 1);
    } else {
      const currentGroupIndex = groups.findIndex((group) => group.key === activeGroup.key);
      const previousGroup = groups[currentGroupIndex - 1];
      if (previousGroup) {
        setActiveGroup(previousGroup);
        setActiveIndex(previousGroup.stories.length - 1);
      }
    }
  }

  return (
    <>
      <section aria-labelledby="community-stories-heading" className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Fresh from local businesses</p>
            <h2 id="community-stories-heading" className="mt-1 text-xl font-bold text-slate-950">Stories</h2>
          </div>
          <span className="text-xs text-slate-500">Available for 24 hours</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {groups.map((group) => {
            const latestStory = group.stories[0];
            return (
              <button key={group.key} type="button" onClick={() => openGroup(group)} className="group flex w-[88px] shrink-0 flex-col items-center gap-2 text-center" aria-label={`View ${group.stories.length} stor${group.stories.length === 1 ? "y" : "ies"} from ${group.businessName}`}>
                <span className="relative rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-teal-500 p-[3px] transition group-hover:scale-105">
                  <span className="block rounded-full bg-white p-[3px]">
                    <span className="block h-[66px] w-[66px] overflow-hidden rounded-full bg-slate-100">
                      <img src={latestStory.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  </span>
                  {group.stories.length > 1 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#1879FD] px-1 text-[10px] font-bold text-white">
                      {group.stories.length}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-xs font-medium text-slate-700">{group.businessName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {activeGroup && activeStory && (
        <div role="dialog" aria-modal="true" aria-label={`Stories from ${activeGroup.businessName}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 sm:p-4" onClick={() => setActiveGroup(null)}>
          <div className="relative flex h-[min(820px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
              {activeGroup.stories.map((story, index) => (
                <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                  <span className={`block h-full rounded-full ${index <= activeIndex ? "bg-white" : "bg-transparent"}`} />
                </span>
              ))}
            </div>

            <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-3">
              <div className="flex min-w-0 items-center gap-3">
                <img src={activeGroup.stories[0].imageUrl} alt="" className="h-9 w-9 rounded-full border border-white/60 object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{activeGroup.businessName}</p>
                  <p className="text-xs text-white/75">{formatStoryDate(activeStory.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveGroup(null)} className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25" aria-label="Close stories"><X className="h-5 w-5" /></button>
            </div>

            <img src={activeStory.imageUrl} alt={activeStory.caption || `Story from ${activeGroup.businessName}`} className="h-full w-full object-contain" />

            <button type="button" onClick={goPrevious} disabled={activeIndex === 0 && groups.findIndex((group) => group.key === activeGroup.key) === 0} aria-label="Previous story" className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-black/60 disabled:opacity-30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={goNext} aria-label="Next story" className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-black/60">
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-5 pb-5 pt-12">
              {activeStory.caption && <p className="mb-3 whitespace-pre-line text-sm leading-6 text-white">{activeStory.caption}</p>}
              <Link href={activeGroup.businessUrl} onClick={() => setActiveGroup(null)} className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">View business</Link>
            </div>

            <button type="button" onClick={goPrevious} aria-label="Go to previous story area" className="absolute inset-y-16 left-0 z-10 w-1/3 cursor-pointer" />
            <button type="button" onClick={goNext} aria-label="Go to next story area" className="absolute inset-y-16 right-0 z-10 w-1/3 cursor-pointer" />
          </div>
        </div>
      )}
    </>
  );
}
